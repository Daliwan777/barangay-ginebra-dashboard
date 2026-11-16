(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const money = (value) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(value || 0));
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const productFallback =
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=240&q=75";
  const state = {
    user: null,
    csrf: "",
    products: [],
    customers: [],
    cart: new Map(),
    period: "day",
    salesChart: null,
    reportChart: null,
  };
  const today = new Date();
  const dateInput = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  async function api(action, data = null, params = {}) {
    const options = { credentials: "same-origin", headers: {} };
    if (data !== null) {
      options.method = "POST";
      options.headers["Content-Type"] = "application/json";
      options.headers["X-CSRF-Token"] = state.csrf;
      options.body = JSON.stringify(data);
    }
    let response;
    const query = new URLSearchParams({ action, ...params });
    try {
      response = await fetch(`api.php?${query}`, options);
    } catch {
      throw new Error(
        "Cannot reach the store server. Check your connection and try again.",
      );
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.error)
      throw new Error(result.error || "The request could not be completed.");
    if (result.csrf) state.csrf = result.csrf;
    return result;
  }
  function toast(message, error = false) {
    const node = document.createElement("div");
    node.className = `toast${error ? " error" : ""}`;
    node.textContent = message;
    $("#toastRegion").append(node);
    setTimeout(() => node.remove(), 3500);
  }
  function showModal(id) {
    $(`#${id}`).hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal(id) {
    $(`#${id}`).hidden = true;
    if (!$$(".modal-backdrop:not([hidden])").length)
      document.body.style.overflow = "";
  }
  function initials(name) {
    return String(name || "")
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase();
  }
  function imageUrl(url) {
    return escapeHtml(url || productFallback);
  }
  function setError(id, message) {
    const el = $(`#${id}`);
    el.textContent = message;
    el.hidden = !message;
  }
  function go(view) {
    if (!$("#view-" + view)) return;
    $$(".view").forEach((section) =>
      section.classList.toggle("active", section.id === `view-${view}`),
    );
    $$(".nav-item").forEach((button) =>
      button.classList.toggle("active", button.dataset.view === view),
    );
    const names = {
      dashboard: "Dashboard",
      inventory: "Inventory",
      pos: "Point of sale",
      reports: "Sales reports",
      customers: "Customers",
      team: "Team access",
    };
    $("#pageTitle").textContent = names[view] || "Dashboard";
    $("#sidebar").classList.remove("open");
    if (view === "pos") {
      renderPosProducts();
      $("#posSearch").focus();
    }
    if (view === "inventory") renderInventory();
    if (view === "reports")
      loadReport().catch((error) => toast(error.message, true));
  }
  function updateUser(user) {
    state.user = user;
    $("#userName").textContent = user.name;
    $("#userRole").textContent =
      user.role === "admin" ? "Administrator" : "Staff";
    $("#welcomeName").textContent = user.name.split(/\s+/)[0];
    $(".user-avatar").textContent = initials(user.name);
    $$(".admin-only").forEach((el) => {
      el.hidden = user.role !== "admin";
    });
    $("#addProduct").hidden = user.role !== "admin";
  }
  async function refreshProducts() {
    const result = await api("products");
    state.products = result.products;
    updateLowStockBadge();
    renderInventory();
    renderPosProducts();
    renderCart();
  }
  function updateLowStockBadge() {
    const count = state.products.filter(
      (item) => Number(item.stock) <= Number(item.low_stock_threshold),
    ).length;
    $("#lowStockBadge").textContent = count;
    $("#lowStockBadge").hidden = !count;
  }
  function renderInventory() {
    const query = ($("#inventorySearch")?.value || "").trim().toLowerCase();
    const filter = $("#stockFilter")?.value || "all";
    const items = state.products.filter((product) => {
      const matches = [
        product.name,
        product.sku,
        product.barcode,
        product.category,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );
      const stock = Number(product.stock),
        threshold = Number(product.low_stock_threshold);
      return (
        matches &&
        (filter === "all" ||
          (filter === "out" ? stock === 0 : stock > 0 && stock <= threshold))
      );
    });
    $("#inventoryCount").textContent = `${items.length} products`;
    $("#emptyInventory").hidden = items.length > 0;
    $("#productRows").innerHTML = items
      .map((product) => {
        const stock = Number(product.stock),
          threshold = Number(product.low_stock_threshold);
        const status =
          stock === 0
            ? ["Out of stock", "out"]
            : stock <= threshold
              ? ["Low stock", "low"]
              : ["In stock", ""];
        const actions =
          state.user?.role === "admin"
            ? `<div class="row-actions"><button type="button" data-edit-product="${product.id}">Edit</button><button type="button" data-delete-product="${product.id}">Delete</button></div>`
            : "";
        return `<tr><td><div class="product-cell"><img class="product-thumb" src="${imageUrl(product.image_url)}" alt="" loading="lazy" onerror="this.src='${productFallback}'"><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.sku || "No SKU")}</small></span></div></td><td>${escapeHtml(product.barcode || "—")}</td><td>${escapeHtml(product.category)}</td><td>${money(product.price)}</td><td>${stock} ${escapeHtml(product.unit || "pcs")}</td><td><span class="stock-status ${status[1]}">${status[0]}</span></td><td>${actions}</td></tr>`;
      })
      .join("");
  }
  function renderPosProducts() {
    if (!$("#posProducts")) return;
    const query = ($("#posSearch").value || $("#globalSearch").value || "")
      .trim()
      .toLowerCase();
    const category = $("#posCategory").value;
    const items = state.products.filter(
      (product) =>
        Number(product.stock) > 0 &&
        [product.name, product.sku, product.barcode, product.category].some(
          (value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
        ) &&
        (category === "all" || product.category === category),
    );
    $("#posProducts").innerHTML = items.length
      ? items
          .map(
            (product) =>
              `<article class="pos-product"><img src="${imageUrl(product.image_url)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='${productFallback}'"><h3 title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</h3><p>${Number(product.stock)} in stock · ${escapeHtml(product.category)}</p><div class="pos-product-bottom"><strong>${money(product.price)}</strong><button type="button" data-add-cart="${product.id}" aria-label="Add ${escapeHtml(product.name)}">+</button></div></article>`,
          )
          .join("")
      : '<div class="empty-state">No in-stock products match your search.</div>';
  }
  function renderCart() {
    const lines = [...state.cart.values()];
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const total = lines.reduce(
      (sum, line) => sum + Number(line.product.price) * line.quantity,
      0,
    );
    $("#cartItemCount").textContent =
      `${count} ${count === 1 ? "item" : "items"}`;
    $("#cartSubtotal").textContent = money(total);
    $("#cartTotal").textContent = money(total);
    $("#chargeAmount").textContent = money(total);
    $("#checkoutButton").disabled = !count;
    $("#cartItems").innerHTML = lines.length
      ? lines
          .map(
            ({ product, quantity }) =>
              `<div class="cart-line"><div><strong>${escapeHtml(product.name)}</strong><small>${money(product.price)} each</small></div><div class="cart-line-end"><strong>${money(Number(product.price) * quantity)}</strong><div class="qty-control"><button type="button" data-cart-qty="${product.id}" data-change="-1" aria-label="Remove one">−</button><span>${quantity}</span><button type="button" data-cart-qty="${product.id}" data-change="1" aria-label="Add one">+</button></div></div></div>`,
          )
          .join("")
      : '<div class="cart-empty"><span>▣</span><strong>Your cart is empty</strong><small>Add products to start a sale.</small></div>';
  }
  function addToCart(id) {
    const product = state.products.find(
      (item) => Number(item.id) === Number(id),
    );
    if (!product) return;
    const existing = state.cart.get(Number(id));
    if ((existing?.quantity || 0) >= Number(product.stock))
      return toast("There is not enough stock for that quantity.", true);
    state.cart.set(Number(id), {
      product,
      quantity: (existing?.quantity || 0) + 1,
    });
    renderCart();
  }
  async function loadCustomers() {
    const result = await api("customers");
    state.customers = result.customers;
    renderCustomers();
    $("#saleCustomer").innerHTML =
      '<option value="">Walk-in customer</option>' +
      state.customers
        .map(
          (customer) =>
            `<option value="${customer.id}">${escapeHtml(customer.name)}</option>`,
        )
        .join("");
  }
  function renderCustomers() {
    const query = ($("#customerSearch")?.value || "").trim().toLowerCase();
    const items = state.customers.filter((customer) =>
      [customer.name, customer.phone, customer.email].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      ),
    );
    $("#customerCount").textContent = `${items.length} customers`;
    $("#emptyCustomers").hidden = items.length > 0;
    $("#customerRows").innerHTML = items
      .map(
        (customer) =>
          `<tr><td><span class="customer-name"><span class="customer-avatar">${initials(customer.name)}</span><strong>${escapeHtml(customer.name)}</strong></span></td><td>${escapeHtml(customer.phone || "—")}</td><td>${escapeHtml(customer.email || "—")}</td><td>${Number(customer.sales_count || 0)}</td><td>${escapeHtml(customer.created_at.slice(0, 10))}</td><td><div class="row-actions"><button type="button" data-edit-customer="${customer.id}">Edit</button><button type="button" data-delete-customer="${customer.id}">Archive</button></div></td></tr>`,
      )
      .join("");
  }
  function renderStockAlerts(products) {
    const alerts = products
      .filter(
        (product) =>
          Number(product.stock) <= Number(product.low_stock_threshold),
      )
      .sort((a, b) => Number(a.stock) - Number(b.stock))
      .slice(0, 5);
    $("#lowStockText").textContent = alerts.length
      ? `${alerts.length} need attention`
      : "No low-stock items";
    $("#stockAlerts").innerHTML = alerts.length
      ? alerts
          .map(
            (product) =>
              `<div class="stock-alert"><img class="alert-thumb" src="${imageUrl(product.image_url)}" alt="" onerror="this.src='${productFallback}'"><div class="alert-product"><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} · ${Number(product.stock)} left</small></div><span class="stock-pill ${Number(product.stock) === 0 ? "out" : ""}">${Number(product.stock) === 0 ? "Out" : "Low"}</span></div>`,
          )
          .join("")
      : '<div class="empty-state">Everything is stocked up. Nice work!</div>';
  }
  function renderSaleRows(rows, target, withStaff = false) {
    $(target).innerHTML = rows.length
      ? rows
          .map(
            (sale) =>
              `<tr><td><span class="sale-id">${escapeHtml(sale.receipt_number)}</span></td><td>${escapeHtml(sale.created_at)}</td><td>${escapeHtml(sale.customer_name || "Walk-in")}</td><td>${Number(sale.item_count)}</td>${withStaff ? `<td>${escapeHtml(sale.staff_name)}</td>` : ""}<td class="align-right">${money(sale.total)}</td></tr>`,
          )
          .join("")
      : `<tr><td colspan="${withStaff ? 6 : 5}" class="empty-state">No sales recorded for this period.</td></tr>`;
  }
  function drawChart(canvasId, labels, values, chartRefName) {
    if (!window.Chart) return;
    if (state[chartRefName]) state[chartRefName].destroy();
    const context = $(`#${canvasId}`);
    state[chartRefName] = new Chart(context, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: "#4b82e8",
            hoverBackgroundColor: "#2263d3",
            borderRadius: 4,
            maxBarThickness: 34,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (item) => money(item.raw) } },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#8793a7", font: { size: 10 } },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: document.body.classList.contains("dark-mode")
                ? "#2b3a50"
                : "#edf0f5",
            },
            ticks: {
              color: "#8793a7",
              callback: (value) => `₱${Number(value).toLocaleString("en-PH")}`,
              font: { size: 9 },
            },
          },
        },
      },
    });
  }
  async function loadDashboard() {
    const result = await api("dashboard");
    $("#todaySales").textContent = money(result.today.total);
    $("#todayCount").textContent = `${result.today.count} transactions`;
    $("#monthSales").textContent = money(result.month.total);
    $("#monthCount").textContent = `${result.month.count} transactions`;
    $("#yearSales").textContent = money(result.year.total);
    $("#yearCount").textContent = `${result.year.count} transactions`;
    $("#stockCount").textContent = Number(result.product_count).toLocaleString(
      "en-PH",
    );
    $("#weekSales").textContent = money(result.week.total);
    renderStockAlerts(result.low_stock);
    renderSaleRows(result.recent_sales, "#recentSales");
    drawChart(
      "salesChart",
      result.week.labels,
      result.week.values,
      "salesChart",
    );
  }
  async function loadReport() {
    const date = $("#reportDate").value || dateInput(today);
    $("#reportDate").value = date;
    const result = await api("reports", null, { period: state.period, date });
    $("#reportHeading").textContent =
      state.period === "day"
        ? "Sales by hour"
        : state.period === "month"
          ? "Sales by day"
          : "Sales by month";
    $("#reportRangeLabel").textContent = result.range_label;
    $("#reportSales").textContent = money(result.summary.total);
    $("#reportTransactions").textContent = Number(
      result.summary.count,
    ).toLocaleString("en-PH");
    $("#reportItems").textContent = Number(result.summary.items).toLocaleString(
      "en-PH",
    );
    $("#reportAverage").textContent = money(result.summary.average);
    renderSaleRows(result.sales, "#reportRows", true);
    drawChart(
      "reportChart",
      result.chart.labels,
      result.chart.values,
      "reportChart",
    );
  }
  async function loadTeam() {
    const result = await api("users");
    $("#userRows").innerHTML = result.users
      .map(
        (user) =>
          `<tr><td><span class="customer-name"><span class="customer-avatar">${initials(user.name)}</span><strong>${escapeHtml(user.name)}</strong></span></td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.role)}</td><td>${escapeHtml(user.created_at.slice(0, 10))}</td></tr>`,
      )
      .join("");
  }
  function showReceipt(sale) {
    const rows = sale.items
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.name)}<br><span style="color:#8793a7">${item.quantity} × ${money(item.price)}</span></td><td>${money(item.quantity * item.price)}</td></tr>`,
      )
      .join("");
    $("#receiptDetails").innerHTML =
      `<div class="receipt-meta"><span>Receipt<br><strong>${escapeHtml(sale.receipt_number)}</strong></span><span style="text-align:right">Date<br><strong>${escapeHtml(sale.created_at)}</strong></span></div><div class="receipt-meta" style="border-top:0"><span>Customer<br><strong>${escapeHtml(sale.customer_name || "Walk-in")}</strong></span><span style="text-align:right">Served by<br><strong>${escapeHtml(sale.staff_name)}</strong></span></div><table class="receipt-items"><tbody>${rows}</tbody></table><div class="receipt-total"><span>TOTAL PAID</span><strong>${money(sale.total)}</strong></div><p class="receipt-note">Thank you for shopping at Daliwan's Builders!<br>Please keep this receipt for your records.</p>`;
    showModal("receiptModal");
  }
  function openProduct(product = null) {
    const form = $("#productForm");
    form.reset();
    form.elements.id.value = product?.id || "";
    $("#productDialogTitle").textContent = product
      ? "Edit product"
      : "Add product";
    if (product)
      Object.entries(product).forEach(([key, value]) => {
        if (form.elements[key]) form.elements[key].value = value ?? "";
      });
    setError("productError", "");
    showModal("productModal");
  }
  async function initialize() {
    $("#yearNow").textContent = today.getFullYear();
    $("#todayLabel").textContent = new Intl.DateTimeFormat("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
      .format(today)
      .toUpperCase();
    $("#posDate").textContent = new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
    }).format(today);
    $("#reportDate").value = dateInput(today);
    const savedTheme = localStorage.getItem("daliwans-theme");
    if (savedTheme === "dark") document.body.classList.add("dark-mode");
    $("#themeToggle").textContent = savedTheme === "dark" ? "☀" : "☾";
    const session = await api("session");
    state.csrf = session.csrf || "";
    if (!session.user) {
      showModal("loginModal");
      return;
    }
    updateUser(session.user);
    await loadApplication();
  }
  async function loadApplication() {
    $("#loginModal").hidden = true;
    await Promise.all([refreshProducts(), loadCustomers(), loadDashboard()]);
    $("#posCategory").innerHTML =
      '<option value="all">All categories</option>' +
      [...new Set(state.products.map((item) => item.category))]
        .sort()
        .map(
          (category) =>
            `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
        )
        .join("");
  }
  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("loginError", "");
    const button = $("button[type=submit]", event.currentTarget);
    button.disabled = true;
    try {
      const result = await api(
        "login",
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      state.csrf = result.csrf;
      updateUser(result.user);
      await loadApplication();
      toast(`Welcome, ${result.user.name.split(/\s+/)[0]}!`);
    } catch (error) {
      setError("loginError", error.message);
    } finally {
      button.disabled = false;
    }
  });
  $("#userMenu").addEventListener("click", async () => {
    if (!confirm("Sign out of Daliwan's Builders?")) return;
    try {
      await api("logout", {});
      state.user = null;
      showModal("loginModal");
    } catch (error) {
      toast(error.message, true);
    }
  });
  $$(".nav-item").forEach((button) =>
    button.addEventListener("click", () => go(button.dataset.view)),
  );
  $$("[data-go]").forEach((button) =>
    button.addEventListener("click", () => go(button.dataset.go)),
  );
  $("#mobileMenu").addEventListener("click", () =>
    $("#sidebar").classList.toggle("open"),
  );
  $("#themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const dark = document.body.classList.contains("dark-mode");
    $("#themeToggle").textContent = dark ? "☀" : "☾";
    localStorage.setItem("daliwans-theme", dark ? "dark" : "light");
    if (state.salesChart) {
      state.salesChart.destroy();
      state.salesChart = null;
    }
    if (state.reportChart) {
      state.reportChart.destroy();
      state.reportChart = null;
    }
    if ($("#view-dashboard").classList.contains("active")) loadDashboard();
    if ($("#view-reports").classList.contains("active")) loadReport();
  });
  $("#globalSearch").addEventListener("input", () => {
    go("pos");
    $("#posSearch").value = $("#globalSearch").value;
    renderPosProducts();
  });
  $("#globalSearch").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      go("pos");
      $("#posSearch").value = event.currentTarget.value;
      renderPosProducts();
      $("#posSearch").focus();
    }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#globalSearch").focus();
    }
    if (event.key === "Escape")
      $$(".modal-backdrop:not([hidden])").forEach((modal) => {
        if (modal.id !== "loginModal") closeModal(modal.id);
      });
  });
  $("#inventorySearch").addEventListener("input", renderInventory);
  $("#stockFilter").addEventListener("change", renderInventory);
  $("#posSearch").addEventListener("input", renderPosProducts);
  $("#posSearch").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const code = event.currentTarget.value.trim().toLowerCase();
    const match = state.products.find((product) =>
      [product.barcode, product.sku].some(
        (value) => String(value || "").toLowerCase() === code,
      ),
    );
    if (match) {
      addToCart(match.id);
      event.currentTarget.value = "";
      renderPosProducts();
    } else toast("No product found for that barcode or SKU.", true);
  });
  $("#posCategory").addEventListener("change", renderPosProducts);
  $("#productRows").addEventListener("click", async (event) => {
    const edit = event.target.closest("[data-edit-product]");
    const remove = event.target.closest("[data-delete-product]");
    if (edit)
      openProduct(
        state.products.find(
          (item) => Number(item.id) === Number(edit.dataset.editProduct),
        ),
      );
    if (remove) {
      const product = state.products.find(
        (item) => Number(item.id) === Number(remove.dataset.deleteProduct),
      );
      if (
        !confirm(
          `Delete "${product.name}" from inventory? This cannot be undone.`,
        )
      )
        return;
      try {
        await api("delete_product", { id: product.id });
        await refreshProducts();
        await loadDashboard();
        toast("Product deleted.");
      } catch (error) {
        toast(error.message, true);
      }
    }
  });
  $("#addProduct").addEventListener("click", () => openProduct());
  $("#productForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("productError", "");
    const form = event.currentTarget,
      values = Object.fromEntries(new FormData(form));
    for (const key of ["price", "stock", "low_stock_threshold"])
      values[key] = Number(values[key]);
    values.id = values.id ? Number(values.id) : null;
    try {
      await api("save_product", values);
      closeModal("productModal");
      await refreshProducts();
      await loadDashboard();
      toast("Product saved.");
    } catch (error) {
      setError("productError", error.message);
    }
  });
  $("#posProducts").addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-cart]");
    if (button) addToCart(button.dataset.addCart);
  });
  $("#cartItems").addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-qty]");
    if (!button) return;
    const id = Number(button.dataset.cartQty),
      line = state.cart.get(id);
    if (!line) return;
    const quantity = line.quantity + Number(button.dataset.change);
    if (quantity <= 0) state.cart.delete(id);
    else if (quantity > Number(line.product.stock))
      return toast("There is not enough stock for that quantity.", true);
    else line.quantity = quantity;
    renderCart();
  });
  $("#clearCart").addEventListener("click", () => {
    state.cart.clear();
    renderCart();
  });
  $("#checkoutButton").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const result = await api("checkout", {
        customer_id: $("#saleCustomer").value || null,
        items: [...state.cart.values()].map((line) => ({
          product_id: line.product.id,
          quantity: line.quantity,
        })),
      });
      state.cart.clear();
      renderCart();
      await Promise.all([refreshProducts(), loadDashboard(), loadCustomers()]);
      showReceipt(result.sale);
      toast("Sale completed successfully.");
    } catch (error) {
      toast(error.message, true);
      button.disabled = false;
    }
  });
  $("#addCustomer").addEventListener("click", () => {
    $("#customerForm").reset();
    $("#customerDialogTitle").textContent = "Add customer";
    setError("customerError", "");
    showModal("customerModal");
  });
  $("#customerRows").addEventListener("click", async (event) => {
    const edit = event.target.closest("[data-edit-customer]");
    const archive = event.target.closest("[data-delete-customer]");
    if (edit) {
      const customer = state.customers.find(
        (item) => Number(item.id) === Number(edit.dataset.editCustomer),
      );
      const form = $("#customerForm");
      form.reset();
      form.elements.id.value = customer.id;
      form.elements.name.value = customer.name;
      form.elements.phone.value = customer.phone || "";
      form.elements.email.value = customer.email || "";
      $("#customerDialogTitle").textContent = "Edit customer";
      setError("customerError", "");
      showModal("customerModal");
    }
    if (archive) {
      const customer = state.customers.find(
        (item) => Number(item.id) === Number(archive.dataset.deleteCustomer),
      );
      if (
        !confirm(
          `Archive "${customer.name}"? Existing sale history will be kept.`,
        )
      )
        return;
      try {
        await api("delete_customer", { id: customer.id });
        await loadCustomers();
        toast("Customer archived.");
      } catch (error) {
        toast(error.message, true);
      }
    }
  });
  $("#customerSearch").addEventListener("input", renderCustomers);
  $("#customerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("customerError", "");
    try {
      await api(
        "save_customer",
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      closeModal("customerModal");
      await loadCustomers();
      toast("Customer saved.");
    } catch (error) {
      setError("customerError", error.message);
    }
  });
  $("#addUser").addEventListener("click", () => {
    $("#userForm").reset();
    setError("userError", "");
    showModal("userModal");
  });
  $("#userForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("userError", "");
    try {
      await api(
        "create_user",
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      closeModal("userModal");
      await loadTeam();
      toast("Team member created.");
    } catch (error) {
      setError("userError", error.message);
    }
  });
  $$(".period-tab").forEach((button) =>
    button.addEventListener("click", () => {
      state.period = button.dataset.period;
      $$(".period-tab").forEach((tab) =>
        tab.classList.toggle("active", tab === button),
      );
      loadReport().catch((error) => toast(error.message, true));
    }),
  );
  $("#runReport").addEventListener("click", () =>
    loadReport().catch((error) => toast(error.message, true)),
  );
  $("#exportReport").addEventListener("click", () => window.print());
  $("#printReceipt").addEventListener("click", () => {
    document.body.classList.add("receipt-printing");
    window.print();
  });
  window.addEventListener("afterprint", () =>
    document.body.classList.remove("receipt-printing"),
  );
  $$("[data-close]").forEach((button) =>
    button.addEventListener("click", () => closeModal(button.dataset.close)),
  );
  $$(".modal-backdrop").forEach((modal) =>
    modal.addEventListener("click", (event) => {
      if (event.target === modal && modal.id !== "loginModal")
        closeModal(modal.id);
    }),
  );
  initialize().catch((error) => {
    showModal("loginModal");
    setError("loginError", error.message);
  });
})();
