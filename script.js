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
      // Only treat as URL if protocol is http/https and original looked like a URL
      return /^https?:/i.test(u.protocol) && /^https?:\/\//i.test(s)
    } catch {
      return false
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast("Copied")
    } catch {
      // Fallback
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.left = "-9999px"
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try {
        document.execCommand("copy")
        showToast("Copied")
      } catch (e) {
        console.error("Copy failed", e)
      } finally {
        document.body.removeChild(ta)
      }
    }
  }

  let toastTimeout = null
  const showToast = (msg) => {
    let toast = document.querySelector(".toast")
    if (!toast) {
      toast = document.createElement("div")
      toast.className = "toast"
      document.body.appendChild(toast)
    }
    toast.textContent = msg
    toast.classList.add("show")
    clearTimeout(toastTimeout)
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 1200)
  }

  // Rendering
  function renderJSON(data, container) {
    container.innerHTML = ""
    const node = buildNode(data, null, 0, true)
    container.appendChild(node)
  }

  function buildNode(value, key, depth, isLast) {
    // Wrapper for a line (or a group for objects/arrays)
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

    // "key": value
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

    const { valueEl, rawText } = renderValue(value)
    content.appendChild(valueEl)

    // Comma if not last
    if (!isLast) {
      const comma = document.createElement("span")
      comma.className = "json-punct"
      comma.textContent = ","
      content.appendChild(comma)
    }

    // Copy button
    const copyBtn = makeCopyButton(key === null ? JSON.stringify(value) : JSON.stringify(value))

    line.append(indent, content, copyBtn)
    return line
  }

  function buildObjectNode(obj, key, depth, isLast) {
    const keys = Object.keys(obj)
    const hasChildren = keys.length > 0

    const details = document.createElement("details")
    details.className = "json-node"
    details.open = true // default expanded

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

    // If empty object, show {} and comma if needed
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

    // Copy button for the object
    const copyBtn = makeCopyButton(JSON.stringify(obj, null, 2))
    copyBtn.style.marginLeft = "auto"

    line.append(indent, disclosure, content, copyBtn)
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

      // Closing brace line
      const closingLine = document.createElement("div")
      closingLine.className = "json-line"
      closingLine.style.setProperty("--indent", `${depth * 16}px`)

      const closingIndent = document.createElement("span")
      closingIndent.className = "json-indent"
      closingIndent.setAttribute("aria-hidden", "true")

      // keep arrow space alignment
      const arrowSpacer = document.createElement("span")
      arrowSpacer.className = "disclosure"
      arrowSpacer.textContent = " " // spacer

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

    // Copy button for array
    const copyBtn = makeCopyButton(JSON.stringify(arr, null, 2))
    copyBtn.style.marginLeft = "auto"

    line.append(indent, disclosure, content, copyBtn)
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

      // Closing bracket line
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
    let rawText = ""

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
      rawText = JSON.stringify(v)
    } else if (typeof v === "number") {
      span.className = "json-number"
      span.textContent = String(v)
      rawText = String(v)
    } else if (typeof v === "boolean") {
      span.className = "json-boolean"
      span.textContent = String(v)
      rawText = String(v)
    } else if (v === null) {
      span.className = "json-null"
      span.textContent = "null"
      rawText = "null"
    } else {
      span.textContent = String(v)
      rawText = String(v)
    }

    return { valueEl: span, rawText }
  }

  function makeCopyButton(textToCopy) {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "copy-btn"
    btn.textContent = "Copy"
    btn.title = "Copy value to clipboard"
    btn.setAttribute("aria-label", "Copy value to clipboard")

    btn.addEventListener("click", (e) => {
      e.stopPropagation() // don't toggle details
      copyToClipboard(textToCopy)
    })

    return btn
  }

  function attachAnimation(details, wrapper) {
    // Based on height transition technique
    const onToggle = () => {
      const isOpen = details.open
      const section = wrapper
      const startHeight = section.getBoundingClientRect().height

      // Prepare end height
      if (isOpen) {
        section.style.height = "auto"
        const endHeight = section.getBoundingClientRect().height
        section.style.height = "0px"
        // force reflow
        section.offsetHeight // eslint-disable-line no-unused-expressions
        section.style.height = `${endHeight}px`
        const onEndOpen = () => {
          section.style.height = "auto"
          section.removeEventListener("transitionend", onEndOpen)
        }
        section.addEventListener("transitionend", onEndOpen)
      } else {
        const endHeight = 0
        section.style.height = `${startHeight}px`
        // force reflow
        section.offsetHeight // eslint-disable-line no-unused-expressions
        section.style.height = `${endHeight}px`
      }
    }

    // Initialize height for opened state
    if (details.open) {
      wrapper.style.height = "auto"
    } else {
      wrapper.style.height = "0px"
    }

    details.addEventListener("toggle", onToggle)
  }
})()
