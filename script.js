;(() => {
  const rootEl = document.getElementById("json-root")

  // Fetch and render
  fetch("./data.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load data.json: ${res.status}`)
      return res.json()
    })
    .then((data) => {
      renderJSON(data, rootEl)
    })
    .catch((err) => {
      console.error(err)
      rootEl.innerHTML =
        '<div role="alert" class="json-line"><span class="json-string">"Error loading data.json"</span></div>'
    })

  // Utils
  const isURL = (s) => {
    if (typeof s !== "string") return false
    try {
      const u = new URL(s, window.location.origin)
      return /^https?:/i.test(u.protocol) && /^https?:\/\//i.test(s)
    } catch {
      return false
    }
  }

  // Clock prompt: update time every second
  const clockLine = document.getElementById("clock-line")
  const timeSpan = clockLine?.querySelector(".prompt-time")
  const formatTime = () => {
    const d = new Date()
    // Example: Fri, Aug 29 2025 14:05:23
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }
  const tick = () => {
    if (timeSpan) timeSpan.textContent = formatTime()
  }
  tick()
  setInterval(tick, 1000)

  // Rendering
  function renderJSON(data, container) {
    container.innerHTML = ""
    const node = buildNode(data, null, 0, true)
    container.appendChild(node)
  }

  function buildNode(value, key, depth, isLast) {
    if (Array.isArray(value)) {
      return buildArrayNode(value, key, depth, isLast)
    } else if (value !== null && typeof value === "object") {
      return buildObjectNode(value, key, depth, isLast)
    } else {
      return buildPrimitiveLine(value, key, depth, isLast)
    }
  }

  function buildPrimitiveLine(value, key, depth, isLast) {
    const line = document.createElement("div")
    line.className = "json-line"
    line.style.setProperty("--indent", `${depth * 16}px`)

    const indent = document.createElement("span")
    indent.className = "json-indent"
    indent.setAttribute("aria-hidden", "true")

    const content = document.createElement("span")

    if (key !== null && key !== undefined) {
      const k = document.createElement("span")
      k.className = "json-key"
      k.textContent = `"${key}"`
      content.appendChild(k)

      const colon = document.createElement("span")
      colon.className = "json-punct"
      colon.textContent = ": "
      content.appendChild(colon)
    }

    const { valueEl } = renderValue(value)
    content.appendChild(valueEl)

    if (!isLast) {
      const comma = document.createElement("span")
      comma.className = "json-punct"
      comma.textContent = ","
      content.appendChild(comma)
    }

    line.append(indent, content)
    return line
  }

  function buildObjectNode(obj, key, depth, isLast) {
    const keys = Object.keys(obj)
    const hasChildren = keys.length > 0

    const details = document.createElement("details")
    details.className = "json-node"
    details.open = true

    const summary = document.createElement("summary")
    summary.setAttribute("role", "treeitem")
    summary.setAttribute("aria-level", String(depth + 1))

    const line = document.createElement("div")
    line.className = "json-line"
    line.style.setProperty("--indent", `${depth * 16}px`)

    const indent = document.createElement("span")
    indent.className = "json-indent"
    indent.setAttribute("aria-hidden", "true")

    const disclosure = document.createElement("span")
    disclosure.className = "disclosure"
    disclosure.textContent = "▸"

    const content = document.createElement("span")
    content.className = "summary-content"

    if (key !== null && key !== undefined) {
      const k = document.createElement("span")
      k.className = "json-key"
      k.textContent = `"${key}"`
      content.appendChild(k)

      const colon = document.createElement("span")
      colon.className = "json-punct"
      colon.textContent = ": "
      content.appendChild(colon)
    }

    const openBrace = document.createElement("span")
    openBrace.className = "json-punct"
    openBrace.textContent = "{"
    content.appendChild(openBrace)

    if (!hasChildren) {
      const closeBrace = document.createElement("span")
      closeBrace.className = "json-punct"
      closeBrace.textContent = "}"
      content.appendChild(closeBrace)

      if (!isLast) {
        const comma = document.createElement("span")
        comma.className = "json-punct"
        comma.textContent = ","
        content.appendChild(comma)
      }
    }

    line.append(indent, disclosure, content)
    summary.appendChild(line)
    details.appendChild(summary)

    if (hasChildren) {
      const wrapper = document.createElement("div")
      wrapper.className = "collapsible"

      const block = document.createElement("div")
      block.className = "block"
      block.setAttribute("role", "group")

      keys.forEach((childKey, idx) => {
        const childIsLast = idx === keys.length - 1
        const childNode = buildNode(obj[childKey], childKey, depth + 1, childIsLast)
        block.appendChild(childNode)
      })

      const closingLine = document.createElement("div")
      closingLine.className = "json-line"
      closingLine.style.setProperty("--indent", `${depth * 16}px`)

      const closingIndent = document.createElement("span")
      closingIndent.className = "json-indent"
      closingIndent.setAttribute("aria-hidden", "true")

      const arrowSpacer = document.createElement("span")
      arrowSpacer.className = "disclosure"
      arrowSpacer.textContent = " "

      const closingContent = document.createElement("span")
      const closeBrace = document.createElement("span")
      closeBrace.className = "json-punct"
      closeBrace.textContent = "}"

      closingContent.appendChild(closeBrace)
      if (!isLast) {
        const comma = document.createElement("span")
        comma.className = "json-punct"
        comma.textContent = ","
        closingContent.appendChild(comma)
      }

      closingLine.append(closingIndent, arrowSpacer, closingContent)

      wrapper.append(block, closingLine)
      details.appendChild(wrapper)

      attachAnimation(details, wrapper)
    }

    return details
  }

  function buildArrayNode(arr, key, depth, isLast) {
    const hasChildren = arr.length > 0

    const details = document.createElement("details")
    details.className = "json-node"
    details.open = true

    const summary = document.createElement("summary")
    summary.setAttribute("role", "treeitem")
    summary.setAttribute("aria-level", String(depth + 1))

    const line = document.createElement("div")
    line.className = "json-line"
    line.style.setProperty("--indent", `${depth * 16}px`)

    const indent = document.createElement("span")
    indent.className = "json-indent"
    indent.setAttribute("aria-hidden", "true")

    const disclosure = document.createElement("span")
    disclosure.className = "disclosure"
    disclosure.textContent = "▸"

    const content = document.createElement("span")
    content.className = "summary-content"

    if (key !== null && key !== undefined) {
      const k = document.createElement("span")
      k.className = "json-key"
      k.textContent = `"${key}"`
      content.appendChild(k)

      const colon = document.createElement("span")
      colon.className = "json-punct"
      colon.textContent = ": "
      content.appendChild(colon)
    }

    const openBracket = document.createElement("span")
    openBracket.className = "json-punct"
    openBracket.textContent = "["
    content.appendChild(openBracket)

    if (!hasChildren) {
      const closeBracket = document.createElement("span")
      closeBracket.className = "json-punct"
      closeBracket.textContent = "]"
      content.appendChild(closeBracket)
      if (!isLast) {
        const comma = document.createElement("span")
        comma.className = "json-punct"
        comma.textContent = ","
        content.appendChild(comma)
      }
    }

    line.append(indent, disclosure, content)
    summary.appendChild(line)
    details.appendChild(summary)

    if (hasChildren) {
      const wrapper = document.createElement("div")
      wrapper.className = "collapsible"

      const block = document.createElement("div")
      block.className = "block"
      block.setAttribute("role", "group")

      arr.forEach((v, idx) => {
        const childIsLast = idx === arr.length - 1
        const childNode = buildNode(v, null, depth + 1, childIsLast)
        block.appendChild(childNode)
      })

      const closingLine = document.createElement("div")
      closingLine.className = "json-line"
      closingLine.style.setProperty("--indent", `${depth * 16}px`)

      const closingIndent = document.createElement("span")
      closingIndent.className = "json-indent"
      closingIndent.setAttribute("aria-hidden", "true")

      const arrowSpacer = document.createElement("span")
      arrowSpacer.className = "disclosure"
      arrowSpacer.textContent = " "

      const closingContent = document.createElement("span")
      const closeBracket = document.createElement("span")
      closeBracket.className = "json-punct"
      closeBracket.textContent = "]"

      closingContent.appendChild(closeBracket)
      if (!isLast) {
        const comma = document.createElement("span")
        comma.className = "json-punct"
        comma.textContent = ","
        closingContent.appendChild(comma)
      }

      closingLine.append(closingIndent, arrowSpacer, closingContent)

      wrapper.append(block, closingLine)
      details.appendChild(wrapper)

      attachAnimation(details, wrapper)
    }

    return details
  }

  function renderValue(v) {
    const span = document.createElement("span")

    if (typeof v === "string") {
      if (isURL(v)) {
        const q = document.createElement("span")
        q.className = "json-string"
        q.textContent = '"'
        const a = document.createElement("a")
        a.href = v
        a.target = "_blank"
        a.rel = "noopener noreferrer"
        a.className = "json-link"
        a.textContent = v
        const q2 = document.createElement("span")
        q2.className = "json-string"
        q2.textContent = '"'
        span.append(q, a, q2)
      } else {
        span.className = "json-string"
        span.textContent = JSON.stringify(v)
      }
    } else if (typeof v === "number") {
      span.className = "json-number"
      span.textContent = String(v)
    } else if (typeof v === "boolean") {
      span.className = "json-boolean"
      span.textContent = String(v)
    } else if (v === null) {
      span.className = "json-null"
      span.textContent = "null"
    } else {
      span.textContent = String(v)
    }

    return { valueEl: span }
  }

  function attachAnimation(details, wrapper) {
    const onToggle = () => {
      const isOpen = details.open
      const section = wrapper
      const startHeight = section.getBoundingClientRect().height

      if (isOpen) {
        section.style.height = "auto"
        const endHeight = section.getBoundingClientRect().height
        section.style.height = "0px"
        section.offsetHeight
        section.style.height = `${endHeight}px`
        const onEndOpen = () => {
          section.style.height = "auto"
          section.removeEventListener("transitionend", onEndOpen)
        }
        section.addEventListener("transitionend", onEndOpen)
      } else {
        const endHeight = 0
        section.style.height = `${startHeight}px`
        section.offsetHeight
        section.style.height = `${endHeight}px`
      }
    }

    if (details.open) {
      wrapper.style.height = "auto"
    } else {
      wrapper.style.height = "0px"
    }

    details.addEventListener("toggle", onToggle)
  }
})()
