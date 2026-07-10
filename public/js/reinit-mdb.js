(function () {
  var mdb = function () {
    return window.mdb || window.bootstrap || null;
  };

  // Dropdowns: data-bs-toggle="dropdown" or data-bs-dropdown-init
  function initDropdowns(root) {
    var nodes = root.querySelectorAll(
      '[data-bs-toggle="dropdown"]:not([data-bs-dropdown-initialized]),' +
        '[data-bs-dropdown-init]:not([data-bs-dropdown-initialized])'
    );
    var C = mdb();
    if (!C || !C.Dropdown) return;
    nodes.forEach(function (el) {
      try {
        C.Dropdown.getOrCreateInstance(el);
        el.setAttribute('data-bs-dropdown-initialized', 'true');
      } catch (e) {}
    });
  }

  // Collapses: data-bs-toggle="collapse" not yet claimed by MDB autoinit
  function initCollapses(root) {
    var nodes = root.querySelectorAll(
      '[data-bs-toggle="collapse"]:not([data-bs-collapse-init])'
    );
    var C = mdb();
    if (!C || !C.Collapse) return;
    nodes.forEach(function (el) {
      try {
        el.setAttribute('data-bs-collapse-init', '');
        var selector = el.getAttribute('data-bs-target') || el.getAttribute('href');
        if (!selector) return;
        document.querySelectorAll(selector).forEach(function (target) {
          C.Collapse.getOrCreateInstance(target, { toggle: false });
        });
      } catch (e) {}
    });
  }

  // Tabs & Pills: data-bs-toggle="tab" | "pill" | "list".
  // MDB only wires its delegated tab click handler when a [data-bs-tab-init],
  function initTabs(root) {
    var nodes = root.querySelectorAll(
      '[data-bs-toggle="tab"]:not([data-bs-tab-initialized]),' +
        '[data-bs-toggle="pill"]:not([data-bs-tab-initialized]),' +
        '[data-bs-toggle="list"]:not([data-bs-tab-initialized])'
    );
    var C = mdb();
    if (!C || !C.Tab) return;
    nodes.forEach(function (el) {
      try {
        el.setAttribute('data-bs-tab-initialized', 'true');
        // Constructing the instance also enables arrow-key navigation between tabs.
        C.Tab.getOrCreateInstance(el);
        el.addEventListener('click', function (e) {
          if (el.tagName === 'A' || el.tagName === 'AREA') e.preventDefault();
          if (
            el.classList.contains('disabled') ||
            el.getAttribute('aria-disabled') === 'true' ||
            el.hasAttribute('disabled')
          )
            return;
          C.Tab.getOrCreateInstance(el).show();
        });
      } catch (e) {}
    });
  }

  // Toasts: initialising registers the global [data-bs-dismiss="toast"] handler
  function initToasts(root) {
    var nodes = root.querySelectorAll('.toast:not([data-bs-toast-initialized])');
    var C = mdb();
    if (!C || !C.Toast) return;
    nodes.forEach(function (el) {
      try {
        C.Toast.getOrCreateInstance(el, { autohide: false });
      } catch (e) {}
    });
  }

  // Alerts: initialising registers the global [data-bs-dismiss="alert"] handler
  function initAlerts(root) {
    var nodes = root.querySelectorAll(
      '.alert-dismissible:not([data-bs-alert-initialized])'
    );
    var C = mdb();
    if (!C || !C.Alert) return;
    nodes.forEach(function (el) {
      try {
        C.Alert.getOrCreateInstance(el);
      } catch (e) {}
    });
  }

  function reinitAll(root) {
    root = root || document;
    initDropdowns(root);
    initCollapses(root);
    initTabs(root);
    initToasts(root);
    initAlerts(root);
  }

  reinitAll(document);

  try {
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) reinitAll(added[j]);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

  if (window.jQuery && window.jQuery(document).ajaxComplete) {
    window.jQuery(document).ajaxComplete(function () {
      reinitAll(document);
    });
  }

  // Public hook for manual re-runs (e.g. after programmatic DOM changes)
  window.reinitMDB = reinitAll;
})();
