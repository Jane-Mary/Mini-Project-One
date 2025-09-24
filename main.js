class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = {
            priority: '',
            status: '',
            date: '',
            search: ''
        };
        
        this.initializeEventListeners();
        this.renderTasks();
        this.updateTaskCount();
    }

    initializeEventListeners() {
        // Task form submission
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Search functionality
        document.getElementById('search-btn').addEventListener('click', () => {
            this.handleSearch();
        });

        document.getElementById('search-input').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Filter functionality
        document.getElementById('priority-filter').addEventListener('change', () => {
            this.handleFilter();
        });

        document.getElementById('status-filter').addEventListener('change', () => {
            this.handleFilter();
        });

        document.getElementById('date-filter').addEventListener('change', () => {
            this.handleFilter();
        });

        // Clear filters
        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    addTask() {
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due-date').value;

        if (!title || !priority || !dueDate) {
            alert('Please fill in all required fields');
            return;
        }

        const task = {
            id: Date.now().toString(),
            title,
            description,
            priority,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateTaskCount();
        this.clearForm();

        // Show success message
        this.showNotification('Task added successfully!', 'success');
    }

    deleteTask(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        
        if (taskElement) {
            taskElement.classList.add('removing');
            
            setTimeout(() => {
                this.tasks = this.tasks.filter(task => task.id !== taskId);
                this.saveTasks();
                this.renderTasks();
                this.updateTaskCount();
                this.showNotification('Task deleted successfully!', 'success');
            }, 300);
        }
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCount();
            
            const status = task.completed ? 'completed' : 'pending';
            this.showNotification(`Task marked as ${status}!`, 'success');
        }
    }

    handleSearch() {
        const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
        this.currentFilter.search = searchTerm;
        this.renderTasks();
    }

    handleFilter() {
        this.currentFilter.priority = document.getElementById('priority-filter').value;
        this.currentFilter.status = document.getElementById('status-filter').value;
        this.currentFilter.date = document.getElementById('date-filter').value;
        this.renderTasks();
    }

    clearFilters() {
        document.getElementById('priority-filter').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('date-filter').value = '';
        document.getElementById('search-input').value = '';
        
        this.currentFilter = {
            priority: '',
            status: '',
            date: '',
            search: ''
        };
        
        this.renderTasks();
    }

    filterTasks() {
        return this.tasks.filter(task => {
            // Priority filter
            if (this.currentFilter.priority && task.priority !== this.currentFilter.priority) {
                return false;
            }

            // Status filter
            if (this.currentFilter.status) {
                const isCompleted = task.completed;
                if (this.currentFilter.status === 'completed' && !isCompleted) return false;
                if (this.currentFilter.status === 'pending' && isCompleted) return false;
            }

            // Date filter
            if (this.currentFilter.date) {
                const taskDate = new Date(task.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                switch (this.currentFilter.date) {
                    case 'today':
                        const todayEnd = new Date(today);
                        todayEnd.setHours(23, 59, 59, 999);
                        if (taskDate < today || taskDate > todayEnd) return false;
                        break;
                    case 'week':
                        const weekEnd = new Date(today);
                        weekEnd.setDate(today.getDate() + 7);
                        if (taskDate < today || taskDate > weekEnd) return false;
                        break;
                    case 'overdue':
                        if (taskDate >= today || task.completed) return false;
                        break;
                }
            }

            // Search filter
            if (this.currentFilter.search) {
                const searchLower = this.currentFilter.search.toLowerCase();
                return task.title.toLowerCase().includes(searchLower) ||
                       task.description.toLowerCase().includes(searchLower);
            }

            return true;
        });
    }

    renderTasks() {
        const tasksContainer = document.getElementById('tasks-container');
        const noTasksElement = document.getElementById('no-tasks');
        const filteredTasks = this.filterTasks();

        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = '';
            noTasksElement.style.display = 'block';
            return;
        }

        noTasksElement.style.display = 'none';
        
        tasksContainer.innerHTML = filteredTasks.map(task => {
            const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
            const dueDateClass = isOverdue ? 'overdue' : '';
            const completedClass = task.completed ? 'completed' : '';
            
            return `
                <div class="task-card ${completedClass} adding" data-task-id="${task.id}">
                    <div class="task-header">
                        <div>
                            <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                            <p class="task-description">${this.escapeHtml(task.description)}</p>
                        </div>
                    </div>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">${task.priority} Priority</span>
                        <span class="task-due-date ${dueDateClass}">
                            Due: ${this.formatDate(task.dueDate)}
                            ${isOverdue ? '(Overdue)' : ''}
                        </span>
                    </div>
                    <div class="task-actions">
                        <button class="complete-btn ${task.completed ? 'completed' : ''}" 
                                onclick="taskManager.toggleTaskCompletion('${task.id}')">
                            ${task.completed ? 'Mark Pending' : 'Mark Complete'}
                        </button>
                        <button class="delete-btn" onclick="taskManager.deleteTask('${task.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Remove adding animation class after animation completes
        setTimeout(() => {
            document.querySelectorAll('.task-card.adding').forEach(card => {
                card.classList.remove('adding');
            });
        }, 500);
    }

    updateTaskCount() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        
        document.getElementById('task-count').textContent = 
            `${totalTasks} total, ${pendingTasks} pending`;
    }

    clearForm() {
        document.getElementById('task-form').reset();
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('task-due-date').value = today;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(300px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(300px);
        }
    }
`;
document.head.appendChild(style);

// Initialize the task manager when the page loads
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-due-date').value = today;
});