// ===== Team Task Management App =====

// ===== Auth Guard =====
(function checkAuthGuard() {
    // Check if user is logged in
    const currentUser = localStorage.getItem('taskflow_current_user');
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
})();

// ===== Data Store =====
const Store = {
    TASKS_KEY: 'taskflow_tasks',
    MEMBERS_KEY: 'taskflow_members',

    // Get tasks from localStorage
    getTasks() {
        const tasks = localStorage.getItem(this.TASKS_KEY);
        return tasks ? JSON.parse(tasks) : [];
    },

    // Save tasks to localStorage
    saveTasks(tasks) {
        localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
    },

    // Get members from localStorage
    getMembers() {
        const members = localStorage.getItem(this.MEMBERS_KEY);
        if (members) {
            return JSON.parse(members);
        }
        // Default members
        const defaultMembers = [
            { id: 1, name: 'Admin', email: 'admin@taskflow.com', role: 'admin', color: '#6366f1' },
            { id: 2, name: 'Nguyễn Văn A', email: 'vana@taskflow.com', role: 'lead', color: '#8b5cf6' },
            { id: 3, name: 'Trần Thị B', email: 'thib@taskflow.com', role: 'member', color: '#ec4899' },
            { id: 4, name: 'Lê Văn C', email: 'vanc@taskflow.com', role: 'member', color: '#14b8a6' }
        ];
        this.saveMembers(defaultMembers);
        return defaultMembers;
    },

    // Save members to localStorage
    saveMembers(members) {
        localStorage.setItem(this.MEMBERS_KEY, JSON.stringify(members));
    },

    COMMENTS_KEY: 'taskflow_comments',
    NOTIFICATIONS_KEY: 'taskflow_notifications',
    ACTIVITY_KEY: 'taskflow_activity',

    getComments() {
        const data = localStorage.getItem(this.COMMENTS_KEY);
        return data ? JSON.parse(data) : [];
    },
    saveComments(c) { localStorage.setItem(this.COMMENTS_KEY, JSON.stringify(c)); },

    getNotifications() {
        const data = localStorage.getItem(this.NOTIFICATIONS_KEY);
        return data ? JSON.parse(data) : [];
    },
    saveNotifications(n) { localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(n)); },

    getActivityLog() {
        const data = localStorage.getItem(this.ACTIVITY_KEY);
        return data ? JSON.parse(data) : [];
    },
    saveActivityLog(log) { localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(log)); }
};

// ===== App State =====
let tasks = Store.getTasks();
let members = Store.getMembers();
let comments = Store.getComments();
let notifications = Store.getNotifications();
let activityLog = Store.getActivityLog();
let currentPage = 'dashboard';
let editingTaskId = null;
let editingMemberId = null;
let deleteType = null;
let deleteId = null;
let sortField = null;
let sortDir = 'asc';
let calendarDate = new Date();
let activeModalTab = 'details';

// ===== DOM Elements =====
const elements = {
    // Navigation
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page'),
    pageTitle: document.querySelector('.page-title'),
    menuToggle: document.getElementById('menuToggle'),
    sidebar: document.querySelector('.sidebar'),
    mainContent: document.querySelector('.main-content'),

    // Search
    searchInput: document.getElementById('searchInput'),

    // Task Modal
    addTaskBtn: document.getElementById('addTaskBtn'),
    taskModal: document.getElementById('taskModal'),
    closeTaskModal: document.getElementById('closeTaskModal'),
    cancelTaskBtn: document.getElementById('cancelTaskBtn'),
    taskForm: document.getElementById('taskForm'),
    modalTitle: document.getElementById('modalTitle'),
    taskId: document.getElementById('taskId'),
    taskTitle: document.getElementById('taskTitle'),
    taskDescription: document.getElementById('taskDescription'),
    taskAssignee: document.getElementById('taskAssignee'),
    taskPriority: document.getElementById('taskPriority'),
    taskDeadline: document.getElementById('taskDeadline'),
    taskStatus: document.getElementById('taskStatus'),
    taskTags: document.getElementById('taskTags'),

    // Member Modal
    addMemberBtn: document.getElementById('addMemberBtn'),
    memberModal: document.getElementById('memberModal'),
    closeMemberModal: document.getElementById('closeMemberModal'),
    cancelMemberBtn: document.getElementById('cancelMemberBtn'),
    memberForm: document.getElementById('memberForm'),
    memberModalTitle: document.getElementById('memberModalTitle'),
    memberId: document.getElementById('memberId'),
    memberName: document.getElementById('memberName'),
    memberEmail: document.getElementById('memberEmail'),
    memberRole: document.getElementById('memberRole'),

    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    deleteMessage: document.getElementById('deleteMessage'),

    // Filters
    filterStatus: document.getElementById('filterStatus'),
    filterPriority: document.getElementById('filterPriority'),
    filterAssignee: document.getElementById('filterAssignee'),

    // Stats
    totalTasks: document.getElementById('totalTasks'),
    todoTasks: document.getElementById('todoTasks'),
    doingTasks: document.getElementById('doingTasks'),
    doneTasks: document.getElementById('doneTasks'),
    completionRate: document.getElementById('completionRate'),
    completionFill: document.getElementById('completionFill'),

    // Lists
    recentTasksList: document.getElementById('recentTasksList'),
    overdueTasksList: document.getElementById('overdueTasksList'),
    tasksTableBody: document.getElementById('tasksTableBody'),
    teamGrid: document.getElementById('teamGrid'),

    // Header extras
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    notificationBadge: document.getElementById('notificationBadge'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),

    // Extended filters
    filterTag: document.getElementById('filterTag'),
    filterDateFrom: document.getElementById('filterDateFrom'),
    filterDateTo: document.getElementById('filterDateTo'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ===== Utility Functions =====
function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
    if (!dateString) return 'Không có';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isOverdue(deadline) {
    if (!deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(deadline) < today;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getMemberById(id) {
    return members.find(m => m.id == id);
}

function showToast(message, type = 'success') {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ===== Navigation =====
function navigateTo(page) {
    currentPage = page;
    
    // Update nav items
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Update pages
    elements.pages.forEach(p => {
        p.classList.toggle('active', p.id === page);
    });
    
    // Update title
    const titles = {
        dashboard: 'Dashboard',
        kanban: 'Kanban Board',
        tasks: 'Tất cả Tasks',
        team: 'Team',
        calendar: 'Lịch',
        activity: 'Nhật ký hoạt động'
    };
    elements.pageTitle.textContent = titles[page] || 'Dashboard';
    
    // Close sidebar on mobile
    elements.sidebar.classList.remove('active');
    
    // Render page content
    renderPage();
}

function renderPage() {
    switch (currentPage) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'kanban':
            renderKanban();
            break;
        case 'tasks':
            renderTasksTable();
            break;
        case 'team':
            renderTeam();
            break;
        case 'calendar':
            renderCalendar();
            break;
        case 'activity':
            renderActivityLog();
            break;
    }
}

// ===== Dashboard =====
function renderDashboard() {
    updateStats();
    renderRecentTasks();
    renderOverdueTasks();
}

function updateStats() {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const doing = tasks.filter(t => t.status === 'doing').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    animateCounter(elements.totalTasks, total);
    animateCounter(elements.todoTasks, todo);
    animateCounter(elements.doingTasks, doing);
    animateCounter(elements.doneTasks, done);

    if (elements.completionRate) {
        elements.completionRate.textContent = rate + '%';
    }
    if (elements.completionFill) {
        elements.completionFill.style.width = rate + '%';
    }

    updateNotificationBadge();
}

function animateCounter(el, target) {
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    if (start === target) return;
    const diff = target - start;
    const steps = 20;
    const stepTime = 300 / steps;
    let step = 0;
    const timer = setInterval(() => {
        step++;
        el.textContent = Math.round(start + diff * (step / steps));
        if (step >= steps) { el.textContent = target; clearInterval(timer); }
    }, stepTime);
}

function updateNotificationBadge() {
    const unread = notifications.filter(n => !n.read).length;
    if (elements.notificationBadge) {
        if (unread > 0) {
            elements.notificationBadge.textContent = unread;
            elements.notificationBadge.classList.add('visible');
        } else {
            elements.notificationBadge.classList.remove('visible');
        }
    }
}

function renderRecentTasks() {
    const recent = [...tasks]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (recent.length === 0) {
        elements.recentTasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Chưa có task nào</p>
            </div>
        `;
        return;
    }

    elements.recentTasksList.innerHTML = recent.map(task => {
        const member = getMemberById(task.assignee);
        return `
            <div class="task-item" onclick="openEditTask('${task.id}')">
                <div class="task-priority ${task.priority}"></div>
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span><i class="fas fa-user"></i> ${member ? member.name : 'Chưa gán'}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(task.deadline)}</span>
                    </div>
                </div>
                <span class="task-status ${task.status}">${task.status}</span>
            </div>
        `;
    }).join('');
}

function renderOverdueTasks() {
    const overdue = tasks.filter(t => t.status !== 'done' && isOverdue(t.deadline));

    if (overdue.length === 0) {
        elements.overdueTasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-double"></i>
                <p>Không có task quá hạn 🎉</p>
            </div>
        `;
        return;
    }

    elements.overdueTasksList.innerHTML = overdue.map(task => {
        const member = getMemberById(task.assignee);
        return `
            <div class="task-item" onclick="openEditTask('${task.id}')">
                <div class="task-priority ${task.priority}"></div>
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span><i class="fas fa-user"></i> ${member ? member.name : 'Chưa gán'}</span>
                        <span style="color: var(--danger)"><i class="fas fa-calendar-times"></i> ${formatDate(task.deadline)}</span>
                    </div>
                </div>
                <span class="task-status ${task.status}">${task.status}</span>
            </div>
        `;
    }).join('');
}

// ===== Kanban Board =====
function renderKanban() {
    const columns = ['todo', 'doing', 'done', 'blocked'];
    
    columns.forEach(status => {
        const columnBody = document.getElementById(`kanban-${status}`);
        const countEl = document.getElementById(`kanban-${status}-count`);
        const statusTasks = getFilteredTasks().filter(t => t.status === status);
        
        countEl.textContent = statusTasks.length;
        
        if (statusTasks.length === 0) {
            columnBody.innerHTML = `
                <div class="empty-state" style="padding: 20px;">
                    <p style="font-size: 0.8rem;">Kéo task vào đây</p>
                </div>
            `;
            return;
        }
        
        columnBody.innerHTML = statusTasks.map(task => {
            const member = getMemberById(task.assignee);
            const overdueClass = isOverdue(task.deadline) && task.status !== 'done' ? 'overdue' : '';
            
            return `
                <div class="kanban-card ${task.priority}" draggable="true" data-id="${task.id}">
                    <div class="kanban-card-title">${task.title}</div>
                    <div class="kanban-card-footer">
                        <div class="kanban-card-assignee">
                            ${member ? `
                                <div class="mini-avatar" style="background: ${member.color}">${getInitials(member.name)}</div>
                                <span>${member.name}</span>
                            ` : '<span>Chưa gán</span>'}
                        </div>
                        ${task.deadline ? `
                            <div class="kanban-card-deadline ${overdueClass}">
                                <i class="fas fa-calendar"></i>
                                ${formatDate(task.deadline)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="kanban-card-actions">
                        ${canEditTask(task) ? `<button onclick="openEditTask('${task.id}')"><i class="fas fa-edit"></i> Sửa</button>` : ''}
                        ${canDeleteTask(task) ? `<button class="delete" onclick="confirmDelete('task', '${task.id}')"><i class="fas fa-trash"></i> Xóa</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    });
    
    // Setup drag and drop
    setupDragAndDrop();
}

function setupDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.column-body');

    cards.forEach(card => {
        card.addEventListener('dragstart', () => card.classList.add('dragging'));
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-target'));
        });
    });

    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            const parentColumn = column.closest('.kanban-column');
            document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-target'));
            if (parentColumn) parentColumn.classList.add('drag-target');
            const dragging = document.querySelector('.dragging');
            if (dragging) column.appendChild(dragging);
        });

        column.addEventListener('dragleave', () => {
            column.closest('.kanban-column')?.classList.remove('drag-target');
        });

        column.addEventListener('drop', e => {
            e.preventDefault();
            document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-target'));
            const dragging = document.querySelector('.dragging');
            if (dragging) {
                const taskId = dragging.dataset.id;
                const newStatus = column.id.replace('kanban-', '');
                updateTaskStatus(taskId, newStatus);
            }
        });
    });
}

function updateTaskStatus(taskId, newStatus) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        const title = tasks[taskIndex].title;
        tasks[taskIndex].status = newStatus;
        tasks[taskIndex].updatedAt = new Date().toISOString();
        Store.saveTasks(tasks);
        logActivity('status_changed', `đã đổi trạng thái task “${title}” sang “${newStatus}”`, taskId);
        addNotification('status_changed', `Task “${title}” chuyển sang ${newStatus}`, taskId);
        renderKanban();
        updateStats();
        showToast('Đã cập nhật trạng thái task');
    }
}

// ===== Tasks Table =====
function getFilteredTasks() {
    let filtered = [...tasks];

    const searchTerm = elements.searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(searchTerm) ||
            (t.description && t.description.toLowerCase().includes(searchTerm)) ||
            (t.tags && t.tags.toLowerCase().includes(searchTerm))
        );
    }

    const statusFilter = elements.filterStatus.value;
    if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter);

    const priorityFilter = elements.filterPriority.value;
    if (priorityFilter !== 'all') filtered = filtered.filter(t => t.priority === priorityFilter);

    const assigneeFilter = elements.filterAssignee.value;
    if (assigneeFilter !== 'all') filtered = filtered.filter(t => t.assignee == assigneeFilter);

    const tagFilter = elements.filterTag?.value.toLowerCase();
    if (tagFilter) {
        filtered = filtered.filter(t => t.tags && t.tags.toLowerCase().includes(tagFilter));
    }

    const dateFrom = elements.filterDateFrom?.value;
    if (dateFrom) filtered = filtered.filter(t => t.deadline && t.deadline >= dateFrom);

    const dateTo = elements.filterDateTo?.value;
    if (dateTo) filtered = filtered.filter(t => t.deadline && t.deadline <= dateTo);

    // Sort
    if (sortField) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        filtered.sort((a, b) => {
            let va = a[sortField] || '';
            let vb = b[sortField] || '';
            if (sortField === 'priority') {
                va = priorityOrder[a.priority] ?? 3;
                vb = priorityOrder[b.priority] ?? 3;
                return sortDir === 'asc' ? va - vb : vb - va;
            }
            if (sortField === 'deadline') {
                va = va ? new Date(va).getTime() : Infinity;
                vb = vb ? new Date(vb).getTime() : Infinity;
                return sortDir === 'asc' ? va - vb : vb - va;
            }
            return sortDir === 'asc'
                ? String(va).localeCompare(String(vb), 'vi')
                : String(vb).localeCompare(String(va), 'vi');
        });
    }

    return filtered;
}

function renderTasksTable() {
    const filtered = getFilteredTasks();
    
    // Update assignee filter options
    elements.filterAssignee.innerHTML = '<option value="all">Tất cả người làm</option>' +
        members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    
    if (filtered.length === 0) {
        elements.tasksTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>Không tìm thấy task nào</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    elements.tasksTableBody.innerHTML = filtered.map(task => {
        const member = getMemberById(task.assignee);
        const overdueClass = isOverdue(task.deadline) && task.status !== 'done' ? 'style="color: var(--danger)"' : '';
        const tagsHtml = task.tags
            ? task.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => `<span class="tag">${t}</span>`).join('')
            : '';

        return `
            <tr>
                <td>
                    <div class="table-task-title">${task.title}</div>
                    ${task.description ? `<div class="table-task-desc">${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</div>` : ''}
                    ${tagsHtml ? `<div class="task-tags">${tagsHtml}</div>` : ''}
                </td>
                <td>
                    ${member ? `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="mini-avatar" style="background: ${member.color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: white;">${getInitials(member.name)}</div>
                            ${member.name}
                        </div>
                    ` : 'Chưa gán'}
                </td>
                <td>
                    <span class="priority-badge ${task.priority}">
                        <i class="fas fa-flag"></i>
                        ${task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'TB' : 'Thấp'}
                    </span>
                </td>
                <td ${overdueClass}>
                    ${formatDate(task.deadline)}
                    ${isOverdue(task.deadline) && task.status !== 'done' ? ' <i class="fas fa-exclamation-circle" style="color:var(--danger)"></i>' : ''}
                </td>
                <td>
                    <span class="task-status ${task.status}">${task.status}</span>
                </td>
                <td>
                    <div class="table-actions">
                        ${canEditTask(task) ? `<button class="btn-icon" onclick="openEditTask('${task.id}')" title="Sửa"><i class="fas fa-edit"></i></button>` : ''}
                        ${canDeleteTask(task) ? `<button class="btn-icon" onclick="confirmDelete('task', '${task.id}')" title="Xóa"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== Team =====
function renderTeam() {
    elements.teamGrid.innerHTML = members.map(member => {
        const memberTasks = tasks.filter(t => t.assignee == member.id);
        const completedTasks = memberTasks.filter(t => t.status === 'done').length;
        const progress = memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0;

        return `
            <div class="team-card">
                <div class="team-avatar" style="background: ${member.color}">${getInitials(member.name)}</div>
                <div class="team-name">${member.name}</div>
                <div class="team-email">${member.email || 'Chưa có email'}</div>
                <span class="team-role ${member.role}">${member.role}</span>
                <div class="team-stats">
                    <div class="team-stat">
                        <div class="team-stat-value">${memberTasks.length}</div>
                        <div class="team-stat-label">Tasks</div>
                    </div>
                    <div class="team-stat">
                        <div class="team-stat-value">${completedTasks}</div>
                        <div class="team-stat-label">Hoàn thành</div>
                    </div>
                    <div class="team-stat">
                        <div class="team-stat-value">${progress}%</div>
                        <div class="team-stat-label">Tiến độ</div>
                    </div>
                </div>
                <div class="member-progress-bar">
                    <div class="member-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="team-card-actions">
                    ${canManageMembers() ? `<button class="btn btn-secondary btn-sm" onclick="openEditMember('${member.id}')">
                        <i class="fas fa-edit"></i> Sửa
                    </button>` : ''}
                    ${canManageMembers() && member.role !== 'admin' ? `<button class="btn btn-secondary btn-sm" onclick="confirmDelete('member', '${member.id}')">
                        <i class="fas fa-trash"></i> Xóa
                    </button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ===== Task CRUD =====
function openTaskModal() {
    editingTaskId = null;
    elements.modalTitle.textContent = 'Thêm Task mới';
    elements.taskForm.reset();
    elements.taskId.value = '';
    if (elements.taskTags) elements.taskTags.value = '';

    elements.taskAssignee.innerHTML = '<option value="">Chọn người phụ trách</option>' +
        members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

    document.getElementById('modalTabs').style.display = 'none';
    switchModalTab('details');
    elements.taskModal.classList.add('active');
}

function openEditTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    editingTaskId = taskId;
    elements.modalTitle.textContent = 'Chỉnh sửa Task';

    elements.taskAssignee.innerHTML = '<option value="">Chọn người phụ trách</option>' +
        members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

    elements.taskId.value = task.id;
    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description || '';
    elements.taskAssignee.value = task.assignee || '';
    elements.taskPriority.value = task.priority;
    elements.taskDeadline.value = task.deadline || '';
    elements.taskStatus.value = task.status;
    if (elements.taskTags) elements.taskTags.value = task.tags || '';

    document.getElementById('modalTabs').style.display = 'flex';
    switchModalTab('details');
    renderComments(taskId);
    renderAttachments(taskId);
    elements.taskModal.classList.add('active');
}

function closeTaskModal() {
    elements.taskModal.classList.remove('active');
    elements.taskForm.reset();
    editingTaskId = null;
    document.getElementById('modalTabs').style.display = 'none';
    switchModalTab('details');
}

function saveTask(e) {
    e.preventDefault();

    // Capture old values for comparison
    let oldStatus = null, oldAssignee = null;
    if (editingTaskId) {
        const oldTask = tasks.find(t => t.id === editingTaskId);
        if (oldTask) { oldStatus = oldTask.status; oldAssignee = oldTask.assignee; }
    }

    const taskData = {
        title: elements.taskTitle.value.trim(),
        description: elements.taskDescription.value.trim(),
        assignee: elements.taskAssignee.value,
        priority: elements.taskPriority.value,
        deadline: elements.taskDeadline.value,
        status: elements.taskStatus.value,
        tags: elements.taskTags ? elements.taskTags.value.trim() : '',
        updatedAt: new Date().toISOString()
    };

    if (editingTaskId) {
        const index = tasks.findIndex(t => t.id === editingTaskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...taskData };
            logActivity('task_updated', `đã cập nhật task “${taskData.title}”`, editingTaskId);
            if (oldStatus && oldStatus !== taskData.status) {
                logActivity('status_changed', `đã đổi trạng thái task “${taskData.title}” từ “${oldStatus}” sang “${taskData.status}”`, editingTaskId);
                addNotification('status_changed', `Task “${taskData.title}” chuyển sang ${taskData.status}`, editingTaskId);
            }
            if (String(oldAssignee) !== String(taskData.assignee) && taskData.assignee) {
                const member = getMemberById(taskData.assignee);
                addNotification('task_assigned', `Task “${taskData.title}” đã được giao cho ${member?.name || 'bạn'}`, editingTaskId);
            }
            showToast('Đã cập nhật task thành công');
        }
    } else {
        const newTask = {
            id: generateId(),
            ...taskData,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        logActivity('task_created', `đã tạo task mới “${taskData.title}”`, newTask.id);
        if (taskData.assignee) {
            const member = getMemberById(taskData.assignee);
            addNotification('task_assigned', `Task “${taskData.title}” đã được giao cho ${member?.name || 'bạn'}`, newTask.id);
        }
        showToast('Đã thêm task mới');
    }

    Store.saveTasks(tasks);
    closeTaskModal();
    renderPage();
}

function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    logActivity('task_deleted', `đã xóa task “${task?.title || '?'}”`);
    tasks = tasks.filter(t => t.id !== taskId);
    Store.saveTasks(tasks);
    showToast('Đã xóa task', 'warning');
    renderPage();
}

// ===== Member CRUD =====
function openMemberModal() {
    editingMemberId = null;
    elements.memberModalTitle.textContent = 'Thêm thành viên';
    elements.memberForm.reset();
    elements.memberId.value = '';
    document.getElementById('color1').checked = true;
    elements.memberModal.classList.add('active');
}

function openEditMember(memberId) {
    const member = members.find(m => m.id == memberId);
    if (!member) return;
    
    editingMemberId = memberId;
    elements.memberModalTitle.textContent = 'Chỉnh sửa thành viên';
    
    elements.memberId.value = member.id;
    elements.memberName.value = member.name;
    elements.memberEmail.value = member.email || '';
    elements.memberRole.value = member.role;
    
    // Set color
    const colorInputs = document.querySelectorAll('.color-picker input');
    colorInputs.forEach(input => {
        input.checked = input.value === member.color;
    });
    
    elements.memberModal.classList.add('active');
}

function closeMemberModal() {
    elements.memberModal.classList.remove('active');
    elements.memberForm.reset();
    editingMemberId = null;
}

function saveMember(e) {
    e.preventDefault();
    
    const selectedColor = document.querySelector('.color-picker input:checked').value;
    
    const memberData = {
        name: elements.memberName.value.trim(),
        email: elements.memberEmail.value.trim(),
        role: elements.memberRole.value,
        color: selectedColor
    };
    
    if (editingMemberId) {
        // Update existing member
        const index = members.findIndex(m => m.id == editingMemberId);
        if (index !== -1) {
            members[index] = { ...members[index], ...memberData };
            showToast('Đã cập nhật thành viên');
        }
    } else {
        // Create new member
        const newMember = {
            id: Date.now(),
            ...memberData
        };
        members.push(newMember);
        showToast('Đã thêm thành viên mới');
    }
    
    Store.saveMembers(members);
    closeMemberModal();
    logActivity(editingMemberId ? 'member_updated' : 'member_added',
        `đã ${editingMemberId ? 'cập nhật' : 'thêm'} thành viên “${memberData.name}”`);
    renderPage();
}

function deleteMember(memberId) {
    const memberName = members.find(m => m.id == memberId)?.name || '?';
    // Check if member has tasks
    const memberTasks = tasks.filter(t => t.assignee == memberId);
    if (memberTasks.length > 0) {
        memberTasks.forEach(t => {
            const index = tasks.findIndex(task => task.id === t.id);
            if (index !== -1) tasks[index].assignee = '';
        });
        Store.saveTasks(tasks);
    }
    members = members.filter(m => m.id != memberId);
    Store.saveMembers(members);
    logActivity('member_deleted', `đã xóa thành viên “${memberName}”`);
    showToast('Đã xóa thành viên', 'warning');
    renderPage();
}

// ===== Delete Confirmation =====
function confirmDelete(type, id) {
    deleteType = type;
    deleteId = id;
    
    if (type === 'task') {
        const task = tasks.find(t => t.id === id);
        elements.deleteMessage.textContent = `Bạn có chắc muốn xóa task "${task?.title}"?`;
    } else {
        const member = members.find(m => m.id == id);
        elements.deleteMessage.textContent = `Bạn có chắc muốn xóa thành viên "${member?.name}"? Các task của thành viên này sẽ được gỡ người phụ trách.`;
    }
    
    elements.deleteModal.classList.add('active');
}

function executeDelete() {
    if (deleteType === 'task') {
        deleteTask(deleteId);
    } else {
        deleteMember(deleteId);
    }
    closeDeleteModal();
}

function closeDeleteModal() {
    elements.deleteModal.classList.remove('active');
    deleteType = null;
    deleteId = null;
}

function initEventListeners() {
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });

    // Mobile menu toggle
    elements.menuToggle.addEventListener('click', () => {
        elements.sidebar.classList.toggle('active');
    });

    // Search
    elements.searchInput.addEventListener('input', () => {
        if (currentPage === 'tasks') renderTasksTable();
        else if (currentPage === 'kanban') renderKanban();
    });

    // Filters
    elements.filterStatus.addEventListener('change', renderTasksTable);
    elements.filterPriority.addEventListener('change', renderTasksTable);
    elements.filterAssignee.addEventListener('change', renderTasksTable);

    // Sort columns
    document.querySelectorAll('.tasks-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (sortField === field) {
                sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                sortField = field;
                sortDir = 'asc';
            }
            document.querySelectorAll('.tasks-table th').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
            th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
            renderTasksTable();
        });
    });

    // Task Modal
    elements.addTaskBtn.addEventListener('click', openTaskModal);
    elements.closeTaskModal.addEventListener('click', closeTaskModal);
    elements.cancelTaskBtn.addEventListener('click', closeTaskModal);
    elements.taskForm.addEventListener('submit', saveTask);

    // Member Modal
    elements.addMemberBtn.addEventListener('click', openMemberModal);
    elements.closeMemberModal.addEventListener('click', closeMemberModal);
    elements.cancelMemberBtn.addEventListener('click', closeMemberModal);
    elements.memberForm.addEventListener('submit', saveMember);

    // Delete Modal
    elements.closeDeleteModal.addEventListener('click', closeDeleteModal);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    elements.confirmDeleteBtn.addEventListener('click', executeDelete);

    // Close modals on outside click
    [elements.taskModal, elements.memberModal, elements.deleteModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    // Theme toggle
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Export CSV
    if (elements.exportCsvBtn) {
        elements.exportCsvBtn.addEventListener('click', exportCSV);
    }

    // Notification bell — toggle dropdown
    const notifBtn = document.getElementById('notificationBtn');
    if (notifBtn) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotificationPanel();
        });
    }

    // Close notification dropdown on outside click
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && dropdown.classList.contains('active')) {
            const wrapper = document.querySelector('.notification-wrapper');
            if (!wrapper?.contains(e.target)) dropdown.classList.remove('active');
        }
    });

    // Extended filters
    elements.filterTag?.addEventListener('input', () => renderTasksTable());
    elements.filterDateFrom?.addEventListener('change', () => renderTasksTable());
    elements.filterDateTo?.addEventListener('change', () => renderTasksTable());

    // Clear all filters
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
        elements.filterStatus.value = 'all';
        elements.filterPriority.value = 'all';
        elements.filterAssignee.value = 'all';
        if (elements.filterTag) elements.filterTag.value = '';
        if (elements.filterDateFrom) elements.filterDateFrom.value = '';
        if (elements.filterDateTo) elements.filterDateTo.value = '';
        renderTasksTable();
        showToast('Dã xóa bộ lọc');
    });

    // Calendar navigation
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
        calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
        renderCalendar();
    });
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
        calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
        renderCalendar();
    });
    document.getElementById('todayBtn')?.addEventListener('click', () => {
        calendarDate = new Date();
        renderCalendar();
    });

    // Activity log clear
    document.getElementById('clearActivityBtn')?.addEventListener('click', clearActivityLog);

    // Modal tabs
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => switchModalTab(tab.dataset.tab));
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskModal();
            closeMemberModal();
            closeDeleteModal();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            elements.searchInput.focus();
        }
        // N = new task (when no modal is open and not typing in input)
        if (e.key === 'n' && !e.ctrlKey && !e.metaKey &&
            document.activeElement.tagName !== 'INPUT' &&
            document.activeElement.tagName !== 'TEXTAREA' &&
            document.activeElement.tagName !== 'SELECT') {
            openTaskModal();
        }
    });
}

// ===== Theme Toggle =====
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('taskflow_theme', newTheme);
    const icon = elements.themeToggleBtn?.querySelector('i');
    if (icon) {
        icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

function initTheme() {
    const saved = localStorage.getItem('taskflow_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const icon = elements.themeToggleBtn?.querySelector('i');
    if (icon) icon.className = saved === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

// ===== Export CSV =====
function exportCSV() {
    const filtered = getFilteredTasks();
    const headers = ['Tiêu đề', 'Mô tả', 'Người phụ trách', 'Độ ưu tiên', 'Deadline', 'Trạng thái', 'Tags'];

    const rows = filtered.map(task => {
        const member = getMemberById(task.assignee);
        return [
            `"${(task.title || '').replace(/"/g, '""')}"`,
            `"${(task.description || '').replace(/"/g, '""')}"`,
            `"${member ? member.name : 'Chưa gán'}"`,
            task.priority,
            task.deadline || '',
            task.status,
            `"${task.tags || ''}"`
        ].join(',');
    });

    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Đã xuất ${filtered.length} task ra CSV`);
}

// ===== Initialize App =====
function init() {
    initTheme();

    // Load sample data if no tasks exist
    if (tasks.length === 0) {
        const sampleTasks = [
            {
                id: generateId(),
                title: 'Thiết kế giao diện Dashboard',
                description: 'Tạo mockup và prototype cho trang Dashboard',
                assignee: 2,
                priority: 'high',
                deadline: '2026-02-05',
                status: 'doing',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                title: 'Viết API cho module Tasks',
                description: 'Phát triển RESTful API cho CRUD tasks',
                assignee: 3,
                priority: 'high',
                deadline: '2026-02-03',
                status: 'todo',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                title: 'Testing UI components',
                description: 'Kiểm tra các component trên nhiều trình duyệt',
                assignee: 4,
                priority: 'medium',
                deadline: '2026-02-10',
                status: 'todo',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                title: 'Tối ưu performance',
                description: 'Cải thiện tốc độ load và rendering',
                assignee: 2,
                priority: 'low',
                deadline: '2026-02-15',
                status: 'blocked',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                title: 'Hoàn thành documentation',
                description: 'Viết tài liệu hướng dẫn sử dụng',
                assignee: 1,
                priority: 'medium',
                deadline: '2026-01-25',
                status: 'done',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        tasks = sampleTasks;
        Store.saveTasks(tasks);
    }
    
    initEventListeners();
    renderDashboard();
    updateUserInfo();
}

// ===== Update User Info in Sidebar =====
function updateUserInfo() {
    const currentUser = JSON.parse(localStorage.getItem('taskflow_current_user'));
    if (!currentUser) return;
    
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    
    if (userName) userName.textContent = currentUser.fullName || 'User';
    if (userRole) userRole.textContent = currentUser.role || 'member';
    if (userAvatar) {
        userAvatar.style.background = currentUser.avatar || '#6366f1';
        const initials = (currentUser.fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        userAvatar.innerHTML = `<span style="font-size: 0.9rem; font-weight: 600;">${initials}</span>`;
    }

    // RBAC: show/hide admin-only elements
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (addMemberBtn) addMemberBtn.style.display = canManageMembers() ? '' : 'none';
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// ============================================================
// ===== RBAC (Role-based Access Control) =====
// ============================================================
function getCurrentUser() {
    const u = localStorage.getItem('taskflow_current_user');
    return u ? JSON.parse(u) : null;
}

function isAdmin() {
    const u = getCurrentUser();
    return u && (u.role === 'admin' || u.role === 'lead');
}

function canEditTask(task) {
    const u = getCurrentUser();
    if (!u) return false;
    if (u.role === 'admin' || u.role === 'lead') return true;
    return String(task.assignee) === String(u.id);
}

function canDeleteTask(task) {
    const u = getCurrentUser();
    if (!u) return false;
    return u.role === 'admin' || u.role === 'lead';
}

function canManageMembers() {
    return isAdmin();
}

// ============================================================
// ===== Activity Log =====
// ============================================================
function logActivity(action, details, taskId = null) {
    const u = getCurrentUser();
    const entry = {
        id: generateId(),
        userId: u?.id || 'system',
        userName: u?.fullName || 'System',
        action,
        details,
        taskId,
        createdAt: new Date().toISOString()
    };
    activityLog.unshift(entry);
    if (activityLog.length > 200) activityLog = activityLog.slice(0, 200);
    Store.saveActivityLog(activityLog);
}

function renderActivityLog() {
    const list = document.getElementById('activityLogList');
    if (!list) return;

    if (activityLog.length === 0) {
        list.innerHTML = `<div class="empty-state"><i class="fas fa-history"></i><p>Chưa có hoạt động nào</p></div>`;
        return;
    }

    const actionIcons = {
        task_created: { icon: 'fa-plus-circle', color: 'var(--success)' },
        task_updated: { icon: 'fa-edit', color: 'var(--info)' },
        task_deleted: { icon: 'fa-trash', color: 'var(--danger)' },
        status_changed: { icon: 'fa-exchange-alt', color: 'var(--warning)' },
        comment_added: { icon: 'fa-comment', color: 'var(--accent-primary)' },
        member_added: { icon: 'fa-user-plus', color: 'var(--success)' },
        member_updated: { icon: 'fa-user-edit', color: 'var(--info)' },
        member_deleted: { icon: 'fa-user-minus', color: 'var(--danger)' },
        file_uploaded: { icon: 'fa-paperclip', color: 'var(--accent-secondary)' }
    };

    list.innerHTML = activityLog.map(entry => {
        const meta = actionIcons[entry.action] || { icon: 'fa-circle', color: 'var(--text-muted)' };
        return `
            <div class="activity-entry">
                <div class="activity-icon-wrap" style="background: ${meta.color}20; color: ${meta.color}">
                    <i class="fas ${meta.icon}"></i>
                </div>
                <div class="activity-content">
                    <p><strong>${escapeHtml(entry.userName)}</strong> ${escapeHtml(entry.details)}</p>
                    <span class="activity-time"><i class="fas fa-clock"></i> ${formatDateTime(entry.createdAt)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function clearActivityLog() {
    if (!isAdmin()) { showToast('Chỉ Admin mới có thể xóa nhật ký', 'error'); return; }
    if (!confirm('Bạn có chắc muốn xóa toàn bộ nhật ký hoạt động?')) return;
    activityLog = [];
    Store.saveActivityLog(activityLog);
    renderActivityLog();
    showToast('Đã xóa nhật ký hoạt động', 'warning');
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ============================================================
// ===== Notification System =====
// ============================================================
function addNotification(type, message, taskId = null) {
    const notif = {
        id: generateId(),
        type,
        message,
        taskId,
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.unshift(notif);
    if (notifications.length > 50) notifications = notifications.slice(0, 50);
    Store.saveNotifications(notifications);
    updateNotificationBadge();
    renderNotificationList();
}

function toggleNotificationPanel() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('active');
    if (dropdown.classList.contains('active')) renderNotificationList();
}

function renderNotificationList() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = `<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>Không có thông báo</p></div>`;
        return;
    }

    const typeIcons = {
        task_assigned: 'fa-user-check',
        comment: 'fa-comment',
        status_changed: 'fa-exchange-alt'
    };

    list.innerHTML = notifications.slice(0, 20).map(n => `
        <div class="notification-item ${n.read ? '' : 'unread'}"
             onclick="handleNotificationClick('${n.id}', '${n.taskId || ''}')">
            <div class="notif-icon-wrap ${n.type}">
                <i class="fas ${typeIcons[n.type] || 'fa-bell'}"></i>
            </div>
            <div class="notif-content">
                <p>${escapeHtml(n.message)}</p>
                <span>${timeAgo(n.createdAt)}</span>
            </div>
            ${!n.read ? '<span class="notif-dot"></span>' : ''}
        </div>
    `).join('');
}

function handleNotificationClick(id, taskId) {
    markNotificationRead(id);
    document.getElementById('notificationDropdown')?.classList.remove('active');
    if (taskId) openEditTask(taskId);
}

function markNotificationRead(id) {
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
        notifications[idx].read = true;
        Store.saveNotifications(notifications);
        updateNotificationBadge();
    }
}

function markAllNotificationsRead() {
    notifications = notifications.map(n => ({ ...n, read: true }));
    Store.saveNotifications(notifications);
    updateNotificationBadge();
    renderNotificationList();
    showToast('Đã đánh dấu tất cả là đã đọc');
}

function timeAgo(dateString) {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
}

// ============================================================
// ===== Comments =====
// ============================================================
function renderComments(taskId) {
    const taskComments = comments
        .filter(c => c.taskId === taskId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const countEl = document.getElementById('commentTabCount');
    if (countEl) countEl.textContent = taskComments.length || '';

    const list = document.getElementById('commentsList');
    if (!list) return;

    if (taskComments.length === 0) {
        list.innerHTML = `<div class="empty-state" style="padding:20px"><i class="fas fa-comments"></i><p>Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!</p></div>`;
        return;
    }

    list.innerHTML = taskComments.map(c => {
        const u = getCurrentUser();
        const canDel = isAdmin() || String(c.userId) === String(u?.id);
        return `
            <div class="comment-item">
                <div class="comment-avatar" style="background:${c.userColor || '#6366f1'}">${getInitials(c.userName)}</div>
                <div class="comment-body">
                    <div class="comment-header">
                        <strong>${escapeHtml(c.userName)}</strong>
                        <span class="comment-time">${formatDateTime(c.createdAt)}</span>
                        ${canDel ? `<button class="comment-delete-btn" onclick="deleteComment('${c.id}')" title="Xóa"><i class="fas fa-times"></i></button>` : ''}
                    </div>
                    <p class="comment-text">${escapeHtml(c.content).replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
    }).join('');

    // Scroll to bottom
    list.scrollTop = list.scrollHeight;
}

function addComment() {
    const input = document.getElementById('commentInput');
    const content = input?.value.trim();
    if (!content) { showToast('Vui lòng nhập nội dung bình luận', 'warning'); return; }
    if (!editingTaskId) return;

    const u = getCurrentUser();
    const newComment = {
        id: generateId(),
        taskId: editingTaskId,
        userId: u?.id || 'unknown',
        userName: u?.fullName || 'Unknown',
        userColor: u?.avatar || '#6366f1',
        content,
        createdAt: new Date().toISOString()
    };

    comments.push(newComment);
    Store.saveComments(comments);

    const task = tasks.find(t => t.id === editingTaskId);
    logActivity('comment_added', `đã bình luận vào task "${task?.title || ''}"`, editingTaskId);
    addNotification('comment', `${u?.fullName || 'Ai đó'} đã bình luận vào task "${task?.title || ''}"`, editingTaskId);

    input.value = '';
    renderComments(editingTaskId);
    showToast('Đã thêm bình luận');
}

function deleteComment(commentId) {
    comments = comments.filter(c => c.id !== commentId);
    Store.saveComments(comments);
    if (editingTaskId) renderComments(editingTaskId);
    showToast('Đã xóa bình luận', 'warning');
}

// ============================================================
// ===== File Attachments =====
// ============================================================
function renderAttachments(taskId) {
    const taskAttachments = getTaskAttachments(taskId);

    const countEl = document.getElementById('attachTabCount');
    if (countEl) countEl.textContent = taskAttachments.length || '';

    const list = document.getElementById('attachmentsList');
    if (!list) return;

    if (taskAttachments.length === 0) {
        list.innerHTML = `<div class="empty-state" style="padding:20px"><i class="fas fa-paperclip"></i><p>Chưa có tệp đính kèm nào</p></div>`;
        return;
    }

    list.innerHTML = taskAttachments.map(a => {
        const icon = getFileIcon(a.type);
        return `
            <div class="attachment-item">
                <div class="attachment-icon"><i class="fas ${icon}"></i></div>
                <div class="attachment-info">
                    <div class="attachment-name" title="${escapeHtml(a.name)}">${escapeHtml(a.name)}</div>
                    <div class="attachment-size">${formatFileSize(a.size)}</div>
                </div>
                <div class="attachment-actions">
                    <a href="${a.data}" download="${escapeHtml(a.name)}" class="btn-icon" title="Tải xuống">
                        <i class="fas fa-download"></i>
                    </a>
                    <button class="btn-icon" onclick="deleteAttachment('${a.id}')" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getTaskAttachments(taskId) {
    const data = localStorage.getItem('taskflow_attachments');
    const all = data ? JSON.parse(data) : [];
    return all.filter(a => a.taskId === taskId);
}

function deleteAttachment(attachId) {
    const data = localStorage.getItem('taskflow_attachments');
    let all = data ? JSON.parse(data) : [];
    all = all.filter(a => a.id !== attachId);
    localStorage.setItem('taskflow_attachments', JSON.stringify(all));
    if (editingTaskId) renderAttachments(editingTaskId);
    showToast('Đã xóa tệp đính kèm', 'warning');
}

function handleFileUpload(files) {
    if (!editingTaskId) return;
    const MAX_SIZE = 2 * 1024 * 1024;

    Array.from(files).forEach(file => {
        if (file.size > MAX_SIZE) {
            showToast(`File "${file.name}" quá lớn (tối đa 2MB)`, 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = localStorage.getItem('taskflow_attachments');
            const all = data ? JSON.parse(data) : [];
            all.push({
                id: generateId(),
                taskId: editingTaskId,
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('taskflow_attachments', JSON.stringify(all));
            const task = tasks.find(t => t.id === editingTaskId);
            logActivity('file_uploaded', `đã đính kèm file "${file.name}" vào task "${task?.title || ''}"`, editingTaskId);
            renderAttachments(editingTaskId);
            showToast(`Đã đính kèm "${file.name}"`);
        };
        reader.readAsDataURL(file);
    });
    document.getElementById('fileAttachInput').value = '';
}

function getFileIcon(mimeType) {
    if (!mimeType) return 'fa-file';
    if (mimeType.includes('image')) return 'fa-file-image';
    if (mimeType.includes('pdf')) return 'fa-file-pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'fa-file-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fa-file-excel';
    if (mimeType.includes('video')) return 'fa-file-video';
    if (mimeType.includes('audio')) return 'fa-file-audio';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'fa-file-archive';
    if (mimeType.includes('text') || mimeType.includes('javascript') || mimeType.includes('json')) return 'fa-file-code';
    return 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
}

// ============================================================
// ===== Modal Tabs =====
// ============================================================
function switchModalTab(tab) {
    activeModalTab = tab;
    document.querySelectorAll('.modal-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    const panelMap = { details: 'tabDetails', comments: 'tabComments', attachments: 'tabAttachments' };
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById(panelMap[tab]);
    if (targetPanel) targetPanel.classList.add('active');

    if (editingTaskId) {
        if (tab === 'comments') renderComments(editingTaskId);
        if (tab === 'attachments') renderAttachments(editingTaskId);
    }
}

// ============================================================
// ===== Calendar View =====
// ============================================================
function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const today = new Date();

    document.getElementById('calendarMonthTitle').textContent =
        new Date(year, month, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '<div class="calendar-weekdays">';
    ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].forEach(d => {
        html += `<div class="weekday-header">${d}</div>`;
    });
    html += '</div><div class="calendar-days">';

    for (let i = 0; i < firstDayOfWeek; i++) html += '<div class="calendar-day empty"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.deadline === dateStr);
        const activeTasks = dayTasks.filter(t => t.status !== 'done');
        const doneTasks = dayTasks.filter(t => t.status === 'done');
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
        const hasOverdue = activeTasks.length > 0 && new Date(dateStr) < today && !isToday;

        html += `<div class="calendar-day${isToday ? ' today' : ''}${hasOverdue ? ' has-overdue' : ''}">
            <div class="day-number">${day}</div>
            <div class="day-tasks">
                ${activeTasks.slice(0, 3).map(t => `
                    <div class="cal-task ${t.priority}" onclick="openEditTask('${t.id}')" title="${escapeHtml(t.title)}">
                        ${t.title.length > 18 ? t.title.slice(0, 18) + '…' : t.title}
                    </div>
                `).join('')}
                ${doneTasks.slice(0, 1).map(t => `
                    <div class="cal-task done" onclick="openEditTask('${t.id}')" title="${escapeHtml(t.title)}">
                        <s>${t.title.length > 18 ? t.title.slice(0, 18) + '…' : t.title}</s>
                    </div>
                `).join('')}
                ${activeTasks.length > 3 ? `<div class="cal-more">+${activeTasks.length - 3} nữa</div>` : ''}
            </div>
        </div>`;
    }
    html += '</div>';
    document.getElementById('calendarGrid').innerHTML = html;
}
