/* ============================================
   TaskFlow Mobile — Application Logic
   jQuery + jQuery Mobile powered Task Manager
   ============================================ */

$(document).on("mobileinit", function () {
    $.mobile.defaultPageTransition = "slide";
    $.mobile.page.prototype.options.domCache = true;
});

$(document).ready(function () {

    // ==========================================
    // Data Layer — localStorage persistence
    // ==========================================
    var STORAGE_KEY = "taskflow_tasks";

    function loadTasks() {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { return []; }
        }
        return getDefaultTasks();
    }

    function saveTasks(tasks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    function getDefaultTasks() {
        var now = new Date();
        return [
            {
                id: generateId(),
                title: "Complete project proposal",
                desc: "Draft the Q4 project proposal with timelines, milestones, and resource allocation for the new product launch.",
                category: "work",
                priority: "high",
                status: "in-progress",
                due: formatDateInput(addDays(now, 2)),
                created: now.toISOString()
            },
            {
                id: generateId(),
                title: "Grocery shopping",
                desc: "Buy vegetables, fruits, milk, bread, and cooking essentials for the week.",
                category: "personal",
                priority: "medium",
                status: "pending",
                due: formatDateInput(addDays(now, 1)),
                created: now.toISOString()
            },
            {
                id: generateId(),
                title: "Morning jogging routine",
                desc: "30-minute jog in the park followed by 10 minutes of stretching exercises.",
                category: "health",
                priority: "medium",
                status: "completed",
                due: formatDateInput(now),
                created: addDays(now, -3).toISOString()
            },
            {
                id: generateId(),
                title: "Read JavaScript Design Patterns",
                desc: "Complete chapters 4-6 on Observer, Mediator, and Prototype patterns.",
                category: "learning",
                priority: "low",
                status: "pending",
                due: formatDateInput(addDays(now, 5)),
                created: addDays(now, -1).toISOString()
            },
            {
                id: generateId(),
                title: "Team standup preparation",
                desc: "Prepare talking points for the weekly standup: blockers, progress, and next steps.",
                category: "work",
                priority: "high",
                status: "pending",
                due: formatDateInput(addDays(now, 1)),
                created: now.toISOString()
            },
            {
                id: generateId(),
                title: "Meditation session",
                desc: "15 minutes guided meditation using the Calm app before bedtime.",
                category: "health",
                priority: "low",
                status: "pending",
                due: formatDateInput(now),
                created: addDays(now, -2).toISOString()
            },
            {
                id: generateId(),
                title: "Learn jQuery Mobile framework",
                desc: "Build a sample multi-page application with navigation, forms, and listviews.",
                category: "learning",
                priority: "medium",
                status: "in-progress",
                due: formatDateInput(addDays(now, 3)),
                created: addDays(now, -2).toISOString()
            },
            {
                id: generateId(),
                title: "Pay electricity bill",
                desc: "Pay the monthly electricity bill before the due date to avoid late charges.",
                category: "personal",
                priority: "high",
                status: "pending",
                due: formatDateInput(addDays(now, 4)),
                created: addDays(now, -1).toISOString()
            }
        ];
    }

    // ==========================================
    // Utility Helpers
    // ==========================================
    function generateId() {
        return "task_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 6);
    }

    function addDays(date, days) {
        var d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    function formatDateInput(date) {
        var d = new Date(date);
        var month = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        return d.getFullYear() + "-" + month + "-" + day;
    }

    function formatDateDisplay(dateStr) {
        if (!dateStr) return "No date";
        var d = new Date(dateStr);
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    }

    function getCategoryEmoji(cat) {
        var map = { work: "🏢", personal: "🏠", health: "💪", learning: "📚" };
        return map[cat] || "📋";
    }

    function getCategoryLabel(cat) {
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    }

    function getStatusLabel(status) {
        var map = { "pending": "Pending", "in-progress": "In Progress", "completed": "Completed" };
        return map[status] || status;
    }

    function getPriorityLabel(priority) {
        return priority.charAt(0).toUpperCase() + priority.slice(1);
    }

    // ==========================================
    // State
    // ==========================================
    var tasks = loadTasks();
    var activeFilter = "all";
    var currentTaskId = null;
    var editingTaskId = null;

    // ==========================================
    // Render Functions
    // ==========================================
    function renderTaskList() {
        var $list = $("#task-list");
        $list.empty();

        var filtered = tasks.filter(function (t) {
            return activeFilter === "all" || t.category === activeFilter;
        });

        // Sort: incomplete first (high > medium > low), then completed
        var statusOrder = { "in-progress": 0, "pending": 1, "completed": 2 };
        var priorityOrder = { "high": 0, "medium": 1, "low": 2 };

        filtered.sort(function (a, b) {
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        if (filtered.length === 0) {
            $list.append(
                '<li data-icon="false" class="tf-empty-state-li">' +
                    '<div class="tf-empty-state">' +
                        '<div class="tf-empty-icon">📭</div>' +
                        '<p class="tf-empty-text">No tasks found</p>' +
                        '<p class="tf-empty-sub">Tap "Add New Task" to create one</p>' +
                    '</div>' +
                '</li>'
            );
        } else {
            $.each(filtered, function (i, task) {
                var doneClass = task.status === "completed" ? " tf-task-done" : "";
                var dotClass = "tf-dot-" + task.priority;
                var chipClass = "tf-chip-" + task.status;

                var li =
                    '<li data-icon="carat-r">' +
                        '<a href="#task-detail" data-task-id="' + task.id + '" class="tf-task-link' + doneClass + '">' +
                            '<h3 class="tf-task-title">' + escapeHtml(task.title) + '</h3>' +
                            '<p class="tf-task-subtitle">' +
                                '<span class="tf-priority-dot ' + dotClass + '"></span>' +
                                '<span>' + getCategoryEmoji(task.category) + ' ' + getCategoryLabel(task.category) + '</span>' +
                                '<span class="tf-status-chip ' + chipClass + '">' + getStatusLabel(task.status) + '</span>' +
                            '</p>' +
                            '<p class="tf-task-subtitle">📅 ' + formatDateDisplay(task.due) + '</p>' +
                        '</a>' +
                    '</li>';

                $list.append(li);
            });
        }

        try { $list.listview("refresh"); } catch (e) { }

        // Update counts
        updateCounts();
    }

    function escapeHtml(text) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    function updateCounts() {
        var pending = tasks.filter(function (t) { return t.status === "pending"; }).length;
        var progress = tasks.filter(function (t) { return t.status === "in-progress"; }).length;
        var done = tasks.filter(function (t) { return t.status === "completed"; }).length;
        var total = tasks.length;

        // Home summary
        $("#pending-count").text(pending);
        $("#progress-count").text(progress);
        $("#done-count").text(done);

        // Task count label
        var filtered = tasks.filter(function (t) {
            return activeFilter === "all" || t.category === activeFilter;
        });
        $("#task-count-label").text(filtered.length + " task" + (filtered.length !== 1 ? "s" : ""));

        // Stats page
        $("#stat-total").text(total);
        $("#stat-pending").text(pending);
        $("#stat-progress").text(progress);
        $("#stat-done").text(done);

        // Completion ring
        var pct = total > 0 ? Math.round((done / total) * 100) : 0;
        $("#completion-percent").text(pct + "%");
        var circumference = 326.73;
        var offset = circumference - (circumference * pct / 100);
        $("#completion-ring").css("stroke-dashoffset", offset);

        // Priority bars
        var high = tasks.filter(function (t) { return t.priority === "high"; }).length;
        var medium = tasks.filter(function (t) { return t.priority === "medium"; }).length;
        var low = tasks.filter(function (t) { return t.priority === "low"; }).length;

        var maxP = Math.max(high, medium, low, 1);
        $("#bar-high").css("width", (high / maxP * 100) + "%");
        $("#bar-medium").css("width", (medium / maxP * 100) + "%");
        $("#bar-low").css("width", (low / maxP * 100) + "%");
        $("#count-high").text(high);
        $("#count-medium").text(medium);
        $("#count-low").text(low);

        // Profile stats
        $("#profile-total").text(total);
        $("#profile-completed").text(done);

        // Category counts
        var cats = ["work", "personal", "health", "learning"];
        $.each(cats, function (i, cat) {
            var count = tasks.filter(function (t) { return t.category === cat; }).length;
            $("[data-cat='" + cat + "']").text(count + " task" + (count !== 1 ? "s" : ""));
            $("[data-cat-count='" + cat + "']").text(count);
        });
    }

    function renderTaskDetail(taskId) {
        var task = tasks.find(function (t) { return t.id === taskId; });
        if (!task) return;

        currentTaskId = taskId;

        $("#detail-title").text(task.title);
        $("#detail-desc").text(task.desc || "No description provided.");

        // Priority badge
        var badgeClass = "tf-badge-" + task.priority;
        $("#detail-priority")
            .text(getPriorityLabel(task.priority))
            .removeClass("tf-badge-high tf-badge-medium tf-badge-low")
            .addClass(badgeClass);

        $("#detail-category").text(getCategoryEmoji(task.category) + " " + getCategoryLabel(task.category));
        $("#detail-due").text(formatDateDisplay(task.due));
        $("#detail-status").text(getStatusLabel(task.status));
        $("#detail-created").text(formatDateDisplay(task.created));

        // Toggle button text
        if (task.status === "completed") {
            $("#toggle-status-btn").text("🔄 Mark Incomplete");
        } else {
            $("#toggle-status-btn").text("✅ Mark Complete");
        }
    }

    // ==========================================
    // Event Handlers
    // ==========================================

    // Category pill filter
    $(document).on("click", ".tf-pill", function () {
        $(".tf-pill").removeClass("tf-pill-active");
        $(this).addClass("tf-pill-active");
        activeFilter = $(this).data("category");
        renderTaskList();
    });

    // Task link → detail page
    $(document).on("click", ".tf-task-link", function () {
        var taskId = $(this).data("task-id");
        renderTaskDetail(taskId);
    });

    // Category page → filter on home
    $(document).on("click", ".tf-category-item", function () {
        var cat = $(this).data("filter-category");
        if (cat) {
            activeFilter = cat;
            $(".tf-pill").removeClass("tf-pill-active");
            $(".tf-pill[data-category='" + cat + "']").addClass("tf-pill-active");
            renderTaskList();
        }
    });

    // Add / Edit Task form submission
    $(document).on("submit", "#task-form", function (e) {
        e.preventDefault();

        var title = $.trim($("#task-title").val());
        if (!title) {
            alert("Please enter a task title.");
            return;
        }

        var taskData = {
            title: title,
            desc: $.trim($("#task-desc").val()),
            category: $("#task-category").val(),
            priority: $("#task-priority").val(),
            due: $("#task-due").val(),
            status: $("#task-status").val()
        };

        if (editingTaskId) {
            // Update existing
            var idx = tasks.findIndex(function (t) { return t.id === editingTaskId; });
            if (idx !== -1) {
                $.extend(tasks[idx], taskData);
            }
            editingTaskId = null;
        } else {
            // Create new
            taskData.id = generateId();
            taskData.created = new Date().toISOString();
            tasks.push(taskData);
        }

        saveTasks(tasks);
        clearForm();
        renderTaskList();

        $.mobile.changePage("#home", { transition: "slide", reverse: true });
    });

    // Toggle task complete/incomplete
    $(document).on("click", "#toggle-status-btn", function () {
        var task = tasks.find(function (t) { return t.id === currentTaskId; });
        if (!task) return;

        task.status = task.status === "completed" ? "pending" : "completed";
        saveTasks(tasks);
        renderTaskDetail(currentTaskId);
        renderTaskList();
    });

    // Edit task
    $(document).on("click", "#edit-task-btn", function () {
        var task = tasks.find(function (t) { return t.id === currentTaskId; });
        if (!task) return;

        editingTaskId = task.id;

        // Pre-fill form
        $("#task-title").val(task.title);
        $("#task-desc").val(task.desc);
        $("#task-due").val(task.due);

        // jQuery Mobile selects need special refresh
        $("#task-category").val(task.category);
        $("#task-priority").val(task.priority);
        $("#task-status").val(task.status);

        try {
            $("#task-category").selectmenu("refresh");
            $("#task-priority").selectmenu("refresh");
            $("#task-status").selectmenu("refresh");
        } catch (e) { }

        $.mobile.changePage("#add-task", { transition: "slide" });
    });

    // Delete task
    $(document).on("click", "#delete-task-btn", function () {
        if (!currentTaskId) return;

        if (confirm("Are you sure you want to delete this task?")) {
            tasks = tasks.filter(function (t) { return t.id !== currentTaskId; });
            saveTasks(tasks);
            currentTaskId = null;
            renderTaskList();
            $.mobile.changePage("#home", { transition: "slide", reverse: true });
        }
    });

    // Clear all tasks from profile
    $(document).on("click", ".tf-settings-list a:contains('Clear All Tasks')", function (e) {
        e.preventDefault();
        if (confirm("This will permanently delete ALL tasks. Are you sure?")) {
            tasks = [];
            saveTasks(tasks);
            renderTaskList();
        }
    });

    // ==========================================
    // Page Events
    // ==========================================
    $(document).on("pagebeforeshow", "#home", function () {
        renderTaskList();
    });

    $(document).on("pagebeforeshow", "#stats", function () {
        updateCounts();
        // Animate ring after a short delay
        setTimeout(function () {
            updateCounts();
        }, 300);
    });

    $(document).on("pagebeforeshow", "#categories-page", function () {
        updateCounts();
    });

    $(document).on("pagebeforeshow", "#profile", function () {
        updateCounts();
    });

    $(document).on("pagebeforeshow", "#add-task", function () {
        if (!editingTaskId) {
            clearForm();
            // Set default due date to tomorrow
            var tomorrow = addDays(new Date(), 1);
            $("#task-due").val(formatDateInput(tomorrow));
        }
    });

    // ==========================================
    // Helpers
    // ==========================================
    function clearForm() {
        $("#task-title").val("");
        $("#task-desc").val("");
        $("#task-due").val("");
        $("#task-category").val("work");
        $("#task-priority").val("medium");
        $("#task-status").val("pending");

        try {
            $("#task-category").selectmenu("refresh");
            $("#task-priority").selectmenu("refresh");
            $("#task-status").selectmenu("refresh");
        } catch (e) { }

        editingTaskId = null;
    }

    // ==========================================
    // Initial Render
    // ==========================================
    saveTasks(tasks);
    renderTaskList();

});
