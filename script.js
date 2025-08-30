;(() => {
  const rootEl = document.getElementById("json-root")
  let lastData = null
  const mqlSmall = window.matchMedia("(max-width: 768px)")
  let indentStep = mqlSmall.matches ? 12 : 16
  mqlSmall.addEventListener?.("change", () => {
    indentStep = mqlSmall.matches ? 12 : 16
    if (lastData) renderJSON(lastData, rootEl)
  })
  const indentPx = (depth) => `${Math.max(0, depth) * indentStep}px`

  // Fetch and render
  fetch("./data.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load data.json: ${res.status}`)
      return res.json()
    })
    .then((data) => {
      lastData = data
      renderJSON(lastData, rootEl)
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
    line.style.setProperty("--indent", indentPx(depth))

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

    if (depth > 0) {
      const indent = document.createElement("span")
      indent.className = "json-indent"
      indent.setAttribute("aria-hidden", "true")
      line.append(indent, content)
    } else {
      line.append(content)
    }

    return line
  }

  function buildObjectNode(obj, key, depth, isLast) {
    const keys = Object.keys(obj)
    const hasChildren = keys.length > 0

    const details = document.createElement("details")
    details.className = "json-node"
    details.open = true
    details.dataset.depth = String(depth)

    const summary = document.createElement("summary")
    summary.setAttribute("role", "treeitem")
    summary.setAttribute("aria-level", String(depth + 1))

    const line = document.createElement("div")
    line.className = "json-line"
    line.style.setProperty("--indent", indentPx(depth))

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

    if (depth > 0) {
      const indent = document.createElement("span")
      indent.className = "json-indent"
      indent.setAttribute("aria-hidden", "true")

      const disclosure = document.createElement("span")
      disclosure.className = "disclosure"
      disclosure.textContent = "▸"

      line.append(indent, disclosure, content)
    } else {
      const disclosure = document.createElement("span")
      disclosure.className = "disclosure"
      disclosure.textContent = "▸"

      line.append(disclosure, content)
    }

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
      closingLine.style.setProperty("--indent", indentPx(depth))

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

      if (depth > 0) {
        const closingIndent = document.createElement("span")
        closingIndent.className = "json-indent"
        closingIndent.setAttribute("aria-hidden", "true")

        const arrowSpacer = document.createElement("span")
        arrowSpacer.className = "disclosure"
        arrowSpacer.textContent = " "

        closingLine.append(closingIndent, arrowSpacer, closingContent)
      } else {
        const arrowSpacer = document.createElement("span")
        arrowSpacer.className = "disclosure"
        arrowSpacer.textContent = " "

        closingLine.append(arrowSpacer, closingContent)
      }

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
    details.dataset.depth = String(depth)

    const summary = document.createElement("summary")
    summary.setAttribute("role", "treeitem")
    summary.setAttribute("aria-level", String(depth + 1))

    const line = document.createElement("div")
    line.className = "json-line"
    line.style.setProperty("--indent", indentPx(depth))

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

    if (depth > 0) {
      const indent = document.createElement("span")
      indent.className = "json-indent"
      indent.setAttribute("aria-hidden", "true")

      const disclosure = document.createElement("span")
      disclosure.className = "disclosure"
      disclosure.textContent = "▸"

      line.append(indent, disclosure, content)
    } else {
      const disclosure = document.createElement("span")
      disclosure.className = "disclosure"
      disclosure.textContent = "▸"

      line.append(disclosure, content)
    }

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
      closingLine.style.setProperty("--indent", indentPx(depth))

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

      if (depth > 0) {
        const closingIndent = document.createElement("span")
        closingIndent.className = "json-indent"
        closingIndent.setAttribute("aria-hidden", "true")

        const arrowSpacer = document.createElement("span")
        arrowSpacer.className = "disclosure"
        arrowSpacer.textContent = " "

        closingLine.append(closingIndent, arrowSpacer, closingContent)
      } else {
        const arrowSpacer = document.createElement("span")
        arrowSpacer.className = "disclosure"
        arrowSpacer.textContent = " "

        closingLine.append(arrowSpacer, closingContent)
      }

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

  const applyCodeSize = (rem) => {
    document.documentElement.style.setProperty("--code-size", `${rem}rem`)
  }
  const initialCodeSize =
    Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--code-size")) || 0.95
  let codeSize = initialCodeSize
  const MIN_SIZE = 0.8
  const MAX_SIZE = 1.3
  const STEP = 0.05
  const btnDec = document.getElementById("font-dec")
  const btnInc = document.getElementById("font-inc")
  btnDec?.addEventListener("click", () => {
    codeSize = Math.max(MIN_SIZE, +(codeSize - STEP).toFixed(2))
    applyCodeSize(codeSize)
  })
  btnInc?.addEventListener("click", () => {
    codeSize = Math.min(MAX_SIZE, +(codeSize + STEP).toFixed(2))
    applyCodeSize(codeSize)
  })
  const wrapToggle = document.getElementById("wrap-toggle")
  if (wrapToggle) {
    const syncWrap = () => {
      rootEl.classList.toggle("wrap", wrapToggle.checked)
      rootEl.classList.toggle("nowrap", !wrapToggle.checked)
    }
    syncWrap()
    wrapToggle.addEventListener("change", syncWrap)
  }
})()
