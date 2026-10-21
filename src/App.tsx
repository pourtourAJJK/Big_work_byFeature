import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react"

type Task = {
  id: number
  title: string
  category: string
  dueDate: string
  completed: boolean
}

type Filter = "all" | "active" | "completed"

const STORAGE_KEY = "quicktask.tasks"

// 首次访问（本地无数据）时展示的示例任务，仅用于演示预览。
const demoTasks: Task[] = [
  { id: 1, title: "整理本周工作计划", category: "工作", dueDate: "2026-10-23", completed: false },
  { id: 2, title: "完成课程作业初稿", category: "学习", dueDate: "2026-10-25", completed: false },
  { id: 3, title: "预约年度健康检查", category: "生活", dueDate: "2026-10-28", completed: false },
  { id: 4, title: "更新个人作品集内容", category: "个人", dueDate: "2026-10-30", completed: true },
  { id: 5, title: "阅读《高效能人士的七个习惯》第 3 章", category: "学习", dueDate: "2026-11-02", completed: false },
  { id: 6, title: "每周运动 3 次（周一/周三/周五）", category: "生活", dueDate: "2026-11-05", completed: false },
  { id: 7, title: "整理季度项目复盘材料", category: "工作", dueDate: "2026-11-08", completed: true },
  { id: 8, title: "给家里打电话", category: "生活", dueDate: "2026-10-22", completed: false },
  { id: 9, title: "复习数据结构与算法", category: "学习", dueDate: "2026-11-12", completed: false },
  { id: 10, title: "备份电脑重要文件", category: "个人", dueDate: "2026-11-15", completed: false },
  { id: 11, title: "准备课堂展示的演示文稿", category: "学习", dueDate: "2026-11-18", completed: false },
  { id: 12, title: "检查邮箱并回复未读邮件", category: "工作", dueDate: "2026-11-20", completed: true },
]

function isValidTask(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === "number" &&
    typeof t.title === "string" &&
    typeof t.category === "string" &&
    typeof t.dueDate === "string" &&
    typeof t.completed === "boolean"
  )
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return demoTasks
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return demoTasks
    return parsed.filter(isValidTask)
  } catch {
    return demoTasks
  }
}

function Icon({
  children,
  size = 18,
  strokeWidth = 1.8,
}: {
  children: ReactNode
  size?: number
  strokeWidth?: number
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    >
      {children}
    </svg>
  )
}

const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

const MoreIcon = () => (
  <Icon size={20}>
    <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
  </Icon>
)

const CalendarIcon = () => (
  <Icon size={16}>
    <path d="M7 3v3M17 3v3M4 9h16" />
    <rect x="4" y="5" width="16" height="16" rx="2" />
  </Icon>
)

const TrashIcon = () => (
  <Icon size={17}>
    <path d="M4 7h16M9 11v6M15 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />
  </Icon>
)

const EditIcon = () => (
  <Icon size={17}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
)

const SearchIcon = () => (
  <Icon size={17}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
)

const CloseIcon = () => (
  <Icon size={20}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date)
}

function Modal({
  children,
  onClose,
  labelledBy,
  compact = false,
}: {
  children: ReactNode
  onClose: () => void
  labelledBy: string
  compact?: boolean
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={`modal ${compact ? "modal-compact" : ""}`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        {children}
      </div>
    </div>
  )
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const completedCount = tasks.filter((task) => task.completed).length
  const activeCount = tasks.length - completedCount

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    let result = tasks
    if (keyword) {
      result = result.filter((task) =>
        task.title.toLowerCase().includes(keyword),
      )
    }
    if (filter === "active") return result.filter((task) => !task.completed)
    if (filter === "completed") return result.filter((task) => task.completed)
    return result
  }, [filter, search, tasks])

  const isEditing = editingTask !== null
  const isModalOpen = isAddOpen || isEditing

  function toggleTask(id: number) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  function openAddModal() {
    setEditingTask(null)
    setTitle("")
    setCategory("")
    setDueDate("")
    setErrors({})
    setIsAddOpen(true)
  }

  function openEditModal(task: Task) {
    setIsAddOpen(false)
    setEditingTask(task)
    setTitle(task.title)
    setCategory(task.category)
    setDueDate(task.dueDate)
    setErrors({})
    setOpenMenuId(null)
  }

  function closeModal() {
    setIsAddOpen(false)
    setEditingTask(null)
    setTitle("")
    setCategory("")
    setDueDate("")
    setErrors({})
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!title.trim()) nextErrors.title = "请输入任务标题"
    if (!category.trim()) nextErrors.category = "请输入任务分类"
    if (!dueDate) nextErrors.dueDate = "请选择截止日期"
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    if (isEditing && editingTask) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingTask.id
            ? {
                ...task,
                title: title.trim(),
                category: category.trim(),
                dueDate,
              }
            : task,
        ),
      )
    } else {
      setTasks((current) => [
        {
          id: Date.now(),
          title: title.trim(),
          category: category.trim(),
          dueDate,
          completed: false,
        },
        ...current,
      ])
      setFilter("all")
    }
    closeModal()
  }

  function confirmDelete() {
    if (!deleteTarget) return
    setTasks((current) => current.filter((task) => task.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const filters: { id: Filter label: string count: number }[] = [
    { id: "all", label: "全部", count: tasks.length },
    { id: "active", label: "待完成", count: activeCount },
    { id: "completed", label: "已完成", count: completedCount },
  ]

  return (
    <div className="app-shell" onClick={() => setOpenMenuId(null)}>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">
              <Icon size={20} strokeWidth={2.2}>
                <path d="M6.5 12.5l3.2 3.2L18 7.5" />
              </Icon>
            </span>
            <span className="brand-name">QuickTask</span>
          </div>
          <button aria-label="打开个人菜单" className="avatar" type="button">
            <Icon size={19}>
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5.5 20c.7-3.2 3.1-5 6.5-5s5.8 1.8 6.5 5" />
            </Icon>
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="welcome-row">
          <div>
            <p className="eyebrow">我的任务</p>
            <h1>今天也向前一步</h1>
            <p className="welcome-copy">
              从一件小事开始，让今天更专注、更有条理。
            </p>
          </div>
          <button
            className="primary-button desktop-add"
            onClick={openAddModal}
            type="button"
          >
            <PlusIcon />
            添加任务
          </button>
        </section>

        <section aria-label="任务统计" className="stats">
          <div className="stat-item">
            <span className="stat-number">{tasks.length}</span>
            <span className="stat-label">全部任务</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">{activeCount}</span>
            <span className="stat-label">
              <span className="status-dot active" />
              待完成
            </span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number muted">{completedCount}</span>
            <span className="stat-label">
              <span className="status-dot done" />
              已完成
            </span>
          </div>
        </section>

        <section className="task-section">
          <div className="task-toolbar">
            <h2>任务列表</h2>
            <div aria-label="筛选任务" className="filters" role="tablist">
              {filters.map((item) => (
                <button
                  aria-selected={filter === item.id}
                  className={filter === item.id ? "filter active" : "filter"}
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  role="tab"
                  type="button"
                >
                  {item.label}
                  <span>{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="search-bar">
            <SearchIcon />
            <input
              aria-label="搜索任务"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索任务标题…"
              type="search"
              value={search}
            />
            {search && (
              <button
                aria-label="清除搜索"
                className="search-clear"
                onClick={() => setSearch("")}
                type="button"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          <div className="task-list">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <article
                  className={`task-row ${task.completed ? "completed" : ""}`}
                  key={task.id}
                >
                  <button
                    aria-label={
                      task.completed
                        ? `标记 ${task.title} 为待完成`
                        : `完成 ${task.title}`
                    }
                    className="check-button"
                    onClick={() => toggleTask(task.id)}
                    type="button"
                  >
                    {task.completed && (
                      <Icon size={14} strokeWidth={2.4}>
                        <path d="M5 12l4 4 10-10" />
                      </Icon>
                    )}
                  </button>
                  <div className="task-body">
                    <p className="task-title">{task.title}</p>
                    <div className="task-meta">
                      <span className="category">{task.category}</span>
                      <span className="date">
                        <CalendarIcon />
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                  <div className="menu-wrap">
                    <button
                      aria-expanded={openMenuId === task.id}
                      aria-label={`${task.title} 的更多操作`}
                      className="more-button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setOpenMenuId((current) =>
                          current === task.id ? null : task.id,
                        )
                      }}
                      type="button"
                    >
                      <MoreIcon />
                    </button>
                    {openMenuId === task.id && (
                      <div
                        className="action-menu"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          onClick={() => openEditModal(task)}
                          type="button"
                        >
                          <EditIcon />
                          编辑任务
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(task)
                            setOpenMenuId(null)
                          }}
                          type="button"
                        >
                          <TrashIcon />
                          删除任务
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  <Icon size={25}>
                    <path d="M7 3h10v4H7zM5 5H3v16h18V5h-2M8 13l2.5 2.5L16 10" />
                  </Icon>
                </span>
                <h3>
                  {search
                    ? "没有匹配的任务"
                    : filter === "active"
                      ? "没有待完成的任务"
                      : filter === "completed"
                        ? "还没有已完成的任务"
                        : "任务清单还是空的"}
                </h3>
                <p>
                  {search
                    ? "试试其他关键词，或清除搜索条件。"
                    : filter === "active"
                      ? "做得很好，今天的任务已经全部完成。"
                      : "添加一个任务，迈出今天的第一步。"}
                </p>
                {!search && filter !== "active" && (
                  <button
                    className="secondary-button"
                    onClick={openAddModal}
                    type="button"
                  >
                    <PlusIcon />
                    添加任务
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <button
          aria-label="添加任务"
          className="mobile-add"
          onClick={openAddModal}
          type="button"
        >
          <PlusIcon />
        </button>
      </main>

      {isModalOpen && (
        <Modal labelledBy="task-modal-title" onClose={closeModal}>
          <div className="modal-header">
            <div>
              <p className="modal-kicker">{isEditing ? "修改任务" : "新任务"}</p>
              <h2 id="task-modal-title">
                {isEditing ? "编辑任务" : "添加任务"}
              </h2>
            </div>
            <button
              aria-label="关闭"
              className="close-button"
              onClick={closeModal}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>
          <form noValidate onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="task-title">任务标题</label>
              <input
                aria-describedby={errors.title ? "title-error" : undefined}
                aria-invalid={Boolean(errors.title)}
                autoFocus
                id="task-title"
                onChange={(event) => {
                  setTitle(event.target.value)
                  if (errors.title)
                    setErrors((current) => ({ ...current, title: "" }))
                }}
                placeholder="例如：整理本周工作计划"
                value={title}
              />
              {errors.title && (
                <span className="field-error" id="title-error">
                  {errors.title}
                </span>
              )}
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="task-category">分类</label>
                <input
                  aria-describedby={
                    errors.category ? "category-error" : undefined
                  }
                  aria-invalid={Boolean(errors.category)}
                  id="task-category"
                  onChange={(event) => {
                    setCategory(event.target.value)
                    if (errors.category)
                      setErrors((current) => ({ ...current, category: "" }))
                  }}
                  placeholder="工作、生活或学习"
                  value={category}
                />
                {errors.category && (
                  <span className="field-error" id="category-error">
                    {errors.category}
                  </span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="task-date">截止日期</label>
                <input
                  aria-describedby={errors.dueDate ? "date-error" : undefined}
                  aria-invalid={Boolean(errors.dueDate)}
                  id="task-date"
                  onChange={(event) => {
                    setDueDate(event.target.value)
                    if (errors.dueDate)
                      setErrors((current) => ({ ...current, dueDate: "" }))
                  }}
                  type="date"
                  value={dueDate}
                />
                {errors.dueDate && (
                  <span className="field-error" id="date-error">
                    {errors.dueDate}
                  </span>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={closeModal}
                type="button"
              >
                取消
              </button>
              <button className="primary-button" type="submit">
                {isEditing ? "保存修改" : "添加任务"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          compact
          labelledBy="delete-task-title"
          onClose={() => setDeleteTarget(null)}
        >
          <div className="delete-icon">
            <TrashIcon />
          </div>
          <h2 id="delete-task-title">删除这个任务？</h2>
          <p className="delete-copy">
            “{deleteTarget.title}”将从任务列表中移除，此操作无法撤销。
          </p>
          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => setDeleteTarget(null)}
              type="button"
            >
              取消
            </button>
            <button
              className="danger-button"
              onClick={confirmDelete}
              type="button"
            >
              确认删除
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
