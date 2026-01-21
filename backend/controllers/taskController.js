const { supabase } = require('../config/supabase');

// Helper function for fuzzy matching
function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function fuzzyMatch(str1, str2) {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    
    let distance = 0;
    const minLen = Math.min(s1.length, s2.length);
    for (let i = 0; i < minLen; i++) {
        if (s1[i] !== s2[i]) distance++;
    }
    distance += Math.abs(s1.length - s2.length);
    
    const similarity = 1 - (distance / maxLen);
    return distance <= 2 && maxLen > 2 ? Math.max(similarity, 0.85) : similarity;
}

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    let query = {};

    // If user is employee, only show their tasks
    if (req.user.role === 'employee') {
      query.assignedTo = req.user.username;
    } else if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    } else if (req.query.employee) {
      // Support old frontend format
      query.assignedTo = req.query.employee;
    }

    if (req.query.status) {
      // Map frontend status to backend status
      const statusMap = {
        'Pending': 'pending',
        'Completed': 'completed',
        'Carried Forward': 'pending' // Carried forward tasks are pending in backend
      };
      query.status = statusMap[req.query.status] || req.query.status.toLowerCase();
    }

    // Build Supabase query
    let supabaseQuery = supabase.from('tasks').select('*');

    if (query.assignedTo) {
      supabaseQuery = supabaseQuery.eq('assigned_to', query.assignedTo);
    }
    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    }

    const { data: tasks, error } = await supabaseQuery.order('date', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Transform to frontend format
    const transformedTasks = (tasks || []).map(task => {
      const taskTextParts = task.task_text.split('\n');
      const title = taskTextParts[0] || task.task_text;
      const description = taskTextParts.slice(1).join('\n') || task.task_text;
      
      // Check if task is carried forward (deadline passed and status is pending)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      const isCarriedForward = task.status === 'pending' && taskDate < today;
      
      // Migrate old status updates to history if history is empty but statusUpdate exists
      let statusHistory = task.status_history || [];
      if (statusHistory.length === 0) {
        const statusUpdate = task.status_update || '';
        const employeeStatus = task.employee_status || '';
        
        if (statusUpdate && statusUpdate.trim()) {
          statusHistory.push({
            statusText: statusUpdate.trim(),
            updatedAt: task.status_updated_at || task.last_updated_on || task.created_at || new Date()
          });
        } else if (employeeStatus && employeeStatus.trim()) {
          statusHistory.push({
            statusText: employeeStatus.trim(),
            updatedAt: task.last_updated_on || task.created_at || new Date()
          });
        }
        
        // If we migrated data, save it back to the database (async, don't wait)
        if (statusHistory.length > 0) {
          supabase
            .from('tasks')
            .update({ status_history: statusHistory })
            .eq('id', task.id)
            .then(() => {})
            .catch(err => console.error('Error migrating status history:', err));
        }
      }
      
      return {
        _id: task.id,
        id: task.id,
        employee: task.assigned_to,
        title: title,
        description: description,
        deadline: task.date,
        assignedDate: task.created_at,
        status: isCarriedForward ? 'Carried Forward' : (task.status.charAt(0).toUpperCase() + task.status.slice(1)),
        statusUpdate: task.status_update || '',
        statusUpdatedAt: task.status_updated_at || null,
        employeeStatus: task.employee_status || '',
        lastUpdatedOn: task.last_updated_on || null,
        statusHistory: statusHistory,
        createdAt: task.created_at
      };
    });

    res.status(200).json(transformedTasks);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Admin
exports.createTask = async (req, res) => {
  try {
    // Support both old frontend format (employee, title, description, deadline) and new format (assignedTo, date, taskText)
    let assignedTo, date, taskText, status;
    
    if (req.body.employee) {
      // Old frontend format
      assignedTo = req.body.employee;
      date = req.body.deadline;
      taskText = `${req.body.title || ''}\n${req.body.description || ''}`.trim();
      status = req.body.status ? req.body.status.toLowerCase() : 'pending';
    } else {
      // New format
      assignedTo = req.body.assignedTo;
      date = req.body.date;
      taskText = req.body.taskText;
      status = req.body.status ? req.body.status.toLowerCase() : 'pending';
    }

    if (!assignedTo || !date || !taskText) {
      return res.status(400).json({ success: false, message: 'Please provide assignedTo/employee, date/deadline, and taskText/title+description' });
    }

    // Check for exact duplicate tasks only (same employee, same date, exact same title)
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*');

    const taskDate = new Date(date);
    const taskDateStr = taskDate.toISOString().split('T')[0];
    const taskTitle = normalizeText(taskText.split('\n')[0] || taskText);
    
    for (const existingTask of (allTasks || [])) {
      const existingDate = new Date(existingTask.date);
      const existingDateStr = existingDate.toISOString().split('T')[0];
      const existingTitle = normalizeText(existingTask.task_text.split('\n')[0] || existingTask.task_text);
      
      const titleMatch = taskTitle === existingTitle;
      const employeeMatch = normalizeText(assignedTo) === normalizeText(existingTask.assigned_to);
      const dateMatch = taskDateStr === existingDateStr;
      
      // Only block if it's an EXACT duplicate (same employee, same date, exact same title)
      if (titleMatch && employeeMatch && dateMatch) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate entry detected',
          existing: {
            assignedTo: existingTask.assigned_to,
            title: existingTask.task_text.split('\n')[0] || existingTask.task_text,
            date: existingTask.date,
            status: existingTask.status
          }
        });
      }
    }

    const { data: task, error: insertError } = await supabase
      .from('tasks')
      .insert({
        assigned_to: assignedTo,
        assigned_by: req.user.username,
        date: new Date(date),
        task_text: taskText,
        status: status === 'completed' ? 'completed' : 'pending'
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ success: false, message: insertError.message });
    }

    // Return in format frontend expects
    const response = {
      _id: task.id,
      id: task.id,
      employee: task.assigned_to,
      title: task.task_text.split('\n')[0] || task.task_text,
      description: task.task_text.split('\n').slice(1).join('\n') || task.task_text,
      deadline: task.date,
      assignedDate: task.created_at,
      status: task.status.charAt(0).toUpperCase() + task.status.slice(1),
      createdAt: task.created_at
    };

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    // Get existing task
    const { data: existingTask, error: findError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Employees can only update status and statusUpdate of their own tasks
    if (req.user.role === 'employee') {
      if (existingTask.assigned_to !== req.user.username) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
      }
      
      const updateData = {};
      
      // Allow employees to update status
      if (req.body.status) {
        const statusMap = {
          'Pending': 'pending',
          'Completed': 'completed',
          'Carried Forward': 'pending'
        };
        updateData.status = statusMap[req.body.status] || req.body.status.toLowerCase();
      }
      
      // Allow employees to update statusUpdate (work status)
      if (req.body.statusUpdate !== undefined) {
        updateData.status_update = req.body.statusUpdate || '';
        updateData.status_updated_at = new Date();
      }
      
      const { data: task, error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ success: false, message: updateError.message });
      }

      // Return in frontend format
      const taskTextParts = task.task_text.split('\n');
      const title = taskTextParts[0] || task.task_text;
      const description = taskTextParts.slice(1).join('\n') || task.task_text;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      const isCarriedForward = task.status === 'pending' && taskDate < today;
      
      const response = {
        _id: task.id,
        id: task.id,
        employee: task.assigned_to,
        title: title,
        description: description,
        deadline: task.date,
        assignedDate: task.created_at,
        status: isCarriedForward ? 'Carried Forward' : (task.status.charAt(0).toUpperCase() + task.status.slice(1)),
        statusUpdate: task.status_update || '',
        statusUpdatedAt: task.status_updated_at || null,
        employeeStatus: task.employee_status || '',
        lastUpdatedOn: task.last_updated_on || null,
        statusHistory: task.status_history || [],
        createdAt: task.created_at
      };

      return res.status(200).json({ success: true, data: response });
    } else {
      // Admin can update all fields - support both formats
      const updateData = {};
      
      if (req.body.employee) {
        updateData.assigned_to = req.body.employee;
      } else if (req.body.assignedTo) {
        updateData.assigned_to = req.body.assignedTo;
      }
      
      if (req.body.deadline) {
        updateData.date = new Date(req.body.deadline);
      } else if (req.body.date) {
        updateData.date = new Date(req.body.date);
      }
      
      if (req.body.title || req.body.description) {
        updateData.task_text = `${req.body.title || ''}\n${req.body.description || ''}`.trim();
      } else if (req.body.taskText) {
        updateData.task_text = req.body.taskText;
      }
      
      if (req.body.status) {
        const statusMap = {
          'Pending': 'pending',
          'Completed': 'completed',
          'Carried Forward': 'pending'
        };
        updateData.status = statusMap[req.body.status] || req.body.status.toLowerCase();
      }
      
      const { data: task, error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ success: false, message: updateError.message });
      }

      // Return in frontend format
      const taskTextParts = task.task_text.split('\n');
      const title = taskTextParts[0] || task.task_text;
      const description = taskTextParts.slice(1).join('\n') || task.task_text;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      const isCarriedForward = task.status === 'pending' && taskDate < today;
      
      const response = {
        _id: task.id,
        id: task.id,
        employee: task.assigned_to,
        title: title,
        description: description,
        deadline: task.date,
        assignedDate: task.created_at,
        status: isCarriedForward ? 'Carried Forward' : (task.status.charAt(0).toUpperCase() + task.status.slice(1)),
        statusUpdate: task.status_update || '',
        statusUpdatedAt: task.status_updated_at || null,
        employeeStatus: task.employee_status || '',
        lastUpdatedOn: task.last_updated_on || null,
        statusHistory: task.status_history || [],
        createdAt: task.created_at
      };

      return res.status(200).json({ success: true, data: response });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
exports.deleteTask = async (req, res) => {
  try {
    // Check if task exists
    const { data: task } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Delete task
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      return res.status(500).json({ success: false, message: deleteError.message });
    }

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task status (employee status update)
// @route   PUT /api/tasks/update-status/:taskId
// @access  Private (Employee only)
exports.updateTaskStatus = async (req, res) => {
  try {
    // Validate that requester role is employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only employees can update task status' 
      });
    }

    const { data: task, error: findError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.taskId)
      .single();

    if (findError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Validate that task is assigned to this employee
    if (task.assigned_to !== req.user.username) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this task. Task is not assigned to you.' 
      });
    }

    // Get status text from request body
    const { statusText } = req.body;

    if (statusText === undefined || statusText === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'statusText is required' 
      });
    }

    // Prepare update data
    const updateData = {
      employee_status: statusText || '',
      last_updated_on: new Date()
    };

    // Add to status history (only if task is not completed and statusText is provided)
    if (task.status !== 'completed' && statusText && statusText.trim()) {
      const statusHistory = task.status_history || [];
      statusHistory.push({
        statusText: statusText.trim(),
        updatedAt: new Date()
      });
      updateData.status_history = statusHistory;
      console.log(`[Status History] Added new status update to task ${task.id}. History now has ${statusHistory.length} entries.`);
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', req.params.taskId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    // Return updated task in frontend format
    const taskTextParts = updatedTask.task_text.split('\n');
    const title = taskTextParts[0] || updatedTask.task_text;
    const description = taskTextParts.slice(1).join('\n') || updatedTask.task_text;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(updatedTask.date);
    taskDate.setHours(0, 0, 0, 0);
    const isCarriedForward = updatedTask.status === 'pending' && taskDate < today;
    
    const response = {
      _id: updatedTask.id,
      id: updatedTask.id,
      employee: updatedTask.assigned_to,
      title: title,
      description: description,
      deadline: updatedTask.date,
      assignedDate: updatedTask.created_at,
      status: isCarriedForward ? 'Carried Forward' : (updatedTask.status.charAt(0).toUpperCase() + updatedTask.status.slice(1)),
      statusUpdate: updatedTask.status_update || '',
      statusUpdatedAt: updatedTask.status_updated_at || null,
      employeeStatus: updatedTask.employee_status || '',
      lastUpdatedOn: updatedTask.last_updated_on || null,
      statusHistory: updatedTask.status_history || [],
      createdAt: updatedTask.created_at
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task status update (employee status update)
// @route   PATCH /api/tasks/:id/status
// @access  Private (Employee only)
exports.updateTaskStatusUpdate = async (req, res) => {
  try {
    // Validate that requester role is employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only employees can update task status' 
      });
    }

    const { data: task, error: findError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Validate that task is assigned to this employee
    if (task.assigned_to !== req.user.username) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this task. Task is not assigned to you.' 
      });
    }

    // Get statusUpdate from request body
    const { statusUpdate } = req.body;

    if (statusUpdate === undefined || statusUpdate === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'statusUpdate is required' 
      });
    }

    // Prepare update data
    const updateData = {
      status_update: statusUpdate || '',
      status_updated_at: new Date()
    };

    // Add to status history (only if task is not completed and statusUpdate is provided)
    if (task.status !== 'completed' && statusUpdate && statusUpdate.trim()) {
      const statusHistory = task.status_history || [];
      statusHistory.push({
        statusText: statusUpdate.trim(),
        updatedAt: new Date()
      });
      updateData.status_history = statusHistory;
      console.log(`[Status History] Added new status update to task ${task.id}. History now has ${statusHistory.length} entries.`);
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    // Return updated task in frontend format
    const taskTextParts = updatedTask.task_text.split('\n');
    const title = taskTextParts[0] || updatedTask.task_text;
    const description = taskTextParts.slice(1).join('\n') || updatedTask.task_text;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(updatedTask.date);
    taskDate.setHours(0, 0, 0, 0);
    const isCarriedForward = updatedTask.status === 'pending' && taskDate < today;
    
    const response = {
      _id: updatedTask.id,
      id: updatedTask.id,
      employee: updatedTask.assigned_to,
      title: title,
      description: description,
      deadline: updatedTask.date,
      assignedDate: updatedTask.created_at,
      status: isCarriedForward ? 'Carried Forward' : (updatedTask.status.charAt(0).toUpperCase() + updatedTask.status.slice(1)),
      statusUpdate: updatedTask.status_update || '',
      statusUpdatedAt: updatedTask.status_updated_at || null,
      statusHistory: updatedTask.status_history || [],
      createdAt: updatedTask.created_at
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
