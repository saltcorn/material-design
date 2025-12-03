const {
  ul,
  li,
  a,
  span,
  hr,
  div,
  text,
  i,
  h6,
  h2,
  h3,
  h1,
  p,
  header,
  footer,
  mkTag,
  button,
  nav,
  img,
  aside,
  form,
  input,
  section,
  style,
} = require("@saltcorn/markup/tags");
const {
  navbar,
  navbarSolidOnScroll,
  headersInHead,
  headersInBody,
  alert,
  activeChecker,
} = require("@saltcorn/markup/layout_utils");
const renderLayout = require("@saltcorn/markup/layout");
const Form = require("@saltcorn/data/models/form");
const Workflow = require("@saltcorn/data/models/workflow");
const { renderForm, link } = require("@saltcorn/markup");
const { features, getState } = require("@saltcorn/data/db/state");
const Plugin = require("@saltcorn/data/models/plugin");
const User = require("@saltcorn/data/models/user");
const db = require("@saltcorn/data/db");
const { sleep } = require("@saltcorn/data/utils");
const { adjustColor, hexToRgb } = require("./adjust-color");

const verstring = features?.version_plugin_serve_path
  ? "@" + require("./package.json").version
  : "";

// when the function from base is not yet available
const _activeChecker = activeChecker
  ? activeChecker
  : (link, currentUrl) => new RegExp(`^${link}(\\/|\\?|#|$)`).test(currentUrl);

// Recursively check if item or any nested subitem is active
const active = (currentUrl, item) => {
  if (item.link && _activeChecker(item.link, currentUrl)) return true;
  if (item.altlinks && item.altlinks.some((l) => _activeChecker(l, currentUrl)))
    return true;
  if (item.subitems && item.subitems.length > 0) {
    return item.subitems.some((si) => active(currentUrl, si));
  }
  return false;
};

const horizontalLineItem = (classes = []) =>
  div(
    { class: ["w-100 flex-shrink-0", ...classes] },
    hr({ class: ["hr my-1"] })
  );

const verticalUserSubItem = (currentUrl, config) => {
  const renderNestedDropdown = (item, parentId, subIx) => {
    if (!item.subitems || !item.subitems.length) {
      return item.link
        ? a(
            {
              class: ["dropdown-item", active(currentUrl, item) && "active"],
              href: text(item.link || "#"),
              ...(item.tooltip
                ? {
                    "data-bs-toggle": "tooltip",
                    "data-bs-placement": "right",
                    "data-mdb-placement": "right",
                    "data-mdb-original-title": item.tooltip,
                    "data-bs-original-title": item.tooltip,
                    "data-mdb-tooltip-initialized": "true",
                    "data-bs-tooltip-initialized": "true",
                  }
                : {}),
            },
            item.icon &&
              item.icon !== "empty" &&
              item.icon !== "undefined" &&
              i({ class: `fa-fw me-1 ${item.icon}` }),
            item.label
          )
        : span({ class: "dropdown-header" }, item.label);
    }
    return div(
      {
        class: "dropdown-item dropend hover-dropdown-item",
      },
      a(
        {
          type: "button",
          class:
            "dropdown-item dropdown-toggle p-0 d-flex align-items-center justify-content-between",
          "data-bs-toggle": "dropdown",
          "aria-expanded": "false",
          "data-mdb-dropdown-initialized": "true",
          "data-bs-dropdown-initialized": "true",
        },
        item.label
      ),
      ul(
        { class: "dropdown-menu hover-dropdown-menu" },
        item.subitems.map((subitem, subsubIx) =>
          li(renderNestedDropdown(subitem, `${parentId}_${subIx}`, subsubIx))
        )
      )
    );
  };

  return (item, ix) => renderNestedDropdown(item, "user_item", ix);
};

const verticalSubItem =
  (currentUrl, parentPath = "") =>
  (item, ix) => {
    const is_active = active(currentUrl, item);
    const itemId = parentPath ? `${parentPath}_${ix}` : `subitem_${ix}`;
    li(
      { class: ["nav-item"] },
      item.link
        ? a(
            {
              class: [
                "nav-link m-0 rounded-0 ripple",
                active(currentUrl, item) && "active",
              ],
              href: text(item.link),
              ...(item.tooltip
                ? {
                    "data-mdb-placement": "right",
                    "data-bs-toggle": "tooltip",
                    title: item.tooltip,
                  }
                : {}),
            },
            item.icon && item.icon !== "empty" && item.icon !== "undefined"
              ? i({
                  class: `me-2 fa-fw ${item.icon} object-fit-contain`,
                  style: "width: 16px; height: 16px;",
                })
              : "",
            item.label
          )
        : span(
            {
              class: [
                "nav-link m-0 rounded-0",
                active(currentUrl, item) && "active",
              ],
            },
            text(item.label)
          )
    );

    return li(
      { class: ["nav-item"] },
      item.subitems
        ? [
            a(
              {
                class: [
                  "nav-link d-flex align-items-center ripple",
                  is_active && "active",
                ],
                href: "#collapse_" + itemId,
                role: "button",
                "data-bs-toggle": "collapse",
                "aria-expanded": is_active ? "true" : "false",
                "aria-controls": "collapse_" + itemId,
              },
              item.icon && item.icon !== "empty" && item.icon !== "undefined"
                ? span(
                    { class: "me-2" },
                    i({
                      class: `fa-fw ${item.icon} object-fit-contain`,
                      style: "width: 16px; height: 16px;",
                    })
                  )
                : "",
              item.label,
              span(
                {
                  class: "ms-auto",
                },
                i({
                  class: "sidenav-collapse-icon fas fa-chevron-down fa-sm",
                })
              )
            ),
            div(
              {
                class: ["collapse", is_active && "show"],
                id: "collapse_" + itemId,
                "data-mdb-collapse-initialized": "true",
                "data-bs-collapse-initialized": "true",
              },
              ul(
                {
                  class: "nav w-100 d-flex flex-column",
                  style: "padding-left: 1rem;",
                },
                item.subitems.map(verticalSubItem(currentUrl, itemId))
              )
            ),
          ]
        : item.link
        ? a(
            {
              class: ["nav-link ripple", active(currentUrl, item) && "active"],
              href: text(item.link),
              "data-mdb-placement": "right",
              "data-bs-toggle": "tooltip",
              title: item.tooltip,
            },
            item.icon && item.icon !== "empty" && item.icon !== "undefined"
              ? i({
                  class: `me-2 fa-fw ${item.icon} object-fit-contain`,
                  style: "width: 16px; height: 16px;",
                })
              : "",
            item.label
          )
        : span(
            {
              class: ["nav-link m-0", active(currentUrl, item) && "active"],
            },
            text(item.label)
          )
    );
  };
const verticalSideBarItem =
  (currentUrl, config, user, nitems) => (item, ix) => {
    const is_active = active(currentUrl, item);
    if (
      item.isUser &&
      config?.avatar_file &&
      user &&
      user[config?.avatar_file]
    ) {
      return li(
        {
          class: ["nav-item dropup", is_active && "active"],
        },
        a(
          {
            class: "nav-link m-0",
            href: "#",
            "data-bs-toggle": "dropdown",
            role: "button",
            "aria-expanded": "false",
            "data-bs-auto-close": "outside",
          },
          span({
            class:
              "avatar avatar-sm fs-4 m-0 bg-body-secondary text-muted-fg border border-1",
            style: `background-image: url(/files/resize/64/64/${
              user?.[config.avatar_file]
            })`,
          })
        ),
        ul(
          {
            class: ["dropdown-menu", ix === nitems - 1 && "dropdown-menu-end"],
          },
          item.subitems.map(verticalUserSubItem(currentUrl, config))
        )
      );
    } else if (item.isUser && user?.email) {
      return li(
        {
          class: ["nav-item dropup", is_active && "active"],
        },
        a(
          {
            class: "nav-link m-0",
            href: "#",
            "data-bs-toggle": "dropdown",
            role: "button",
            "aria-expanded": "false",
            "data-bs-auto-close": "outside",
            title: item?.tooltip,
          },
          div(
            {
              class: "fs-4 m-0 bg-body-secondary text-muted-fg border border-1",
              style:
                "border-radius: 50%; width: 40px; height:40px; display: flex;align-items: center; justify-content: center;",
            },
            user.email[0].toUpperCase()
          )
        ),
        ul(
          {
            class: ["dropdown-menu", ix === nitems - 1 && "dropdown-menu-end"],
          },
          item.subitems.map(verticalUserSubItem(currentUrl, config))
        )
      );
    }
    {
      return li(
        {
          class: ["nav-item"],
        },
        item.type === "Separator"
          ? horizontalLineItem()
          : item.type === "Search"
          ? form(
              {
                action: "/search",
                class: "menusearch ms-2",
                method: "get",
                autocomplete: "off",
                novalidate: "",
              },
              div(
                { class: "input-icon" },
                span(
                  { class: "input-icon-addon" },
                  i({ class: "fas fa-search" })
                ),
                input({
                  type: "text",
                  value: "",
                  class: "form-control",
                  placeholder: "Search…",
                  "aria-label": "Search in website",
                })
              )
            )
          : item.subitems
          ? [
              a(
                {
                  class: [
                    "nav-link d-flex align-items-center ripple",
                    is_active && "active",
                  ],
                  href: "#collapse_item_" + ix,
                  role: "button",
                  "data-bs-toggle": "collapse",
                  "aria-expanded": is_active ? "true" : "false",
                  "aria-controls": "collapse_item_" + ix,
                  title: item?.tooltip,
                },
                item.icon && item.icon !== "empty" && item.icon !== "undefined"
                  ? span(
                      { class: "me-2" },
                      i({
                        class: `fa-fw ${item.icon} object-fit-contain`,
                        style: "width: 16px; height: 16px;",
                      })
                    )
                  : "",
                item.label,
                span(
                  { class: "ms-auto" },
                  i({
                    class: "sidenav-collapse-icon fas fa-chevron-down fa-sm",
                  })
                )
              ),
              div(
                {
                  class: ["collapse", is_active && "show"],
                  id: "collapse_item_" + ix,
                },
                ul(
                  { class: "nav w-100 d-flex flex-column" },
                  item.subitems.map(verticalSubItem(currentUrl, `item_${ix}`))
                )
              ),
            ]
          : a(
              {
                class: [
                  item.style && item.style.includes("btn")
                    ? "ms-2"
                    : "nav-link",
                  "ripple",
                  item.style || "",
                  is_active && "active",
                ],
                href: text(item.link),
                ...(is_active && { "aria-current": "page" }),
                ...(item.tooltip
                  ? {
                      "data-mdb-placement": "right",
                      "data-bs-toggle": "tooltip",
                      title: item.tooltip,
                    }
                  : {}),
              },
              item.icon && item.icon !== "empty" && item.icon !== "undefined"
                ? span(
                    { class: "me-2" },
                    i({
                      class: `fa-fw ${item.icon} object-fit-contain`,
                      style: "width: 16px; height: 16px;",
                    })
                  )
                : "",
              text(item.label)
            )
      );
    }
  };

const sideBarSection = (currentUrl, config, user) => (section) =>
  [
    section.items
      .map(verticalSideBarItem(currentUrl, config, user, section.items.length))
      .join(""),
  ];

const splitPrimarySecondaryMenu = (menu) => {
  return {
    primary: menu
      .map((mi) => ({
        ...mi,
        items: mi.items.filter(
          (item) =>
            item.location !== "Secondary Menu" &&
            mi.section !== "User" &&
            !mi.isUser
        ),
      }))
      .filter(({ items }) => items.length),
    secondary: menu
      .map((mi) => ({
        ...mi,
        items: mi.items.filter(
          (item) =>
            item.location === "Secondary Menu" ||
            mi.section === "User" ||
            mi.isUser
        ),
      }))
      .filter(({ items }) => items.length),
  };
};

const showBrand = (brand, config) =>
  a(
    {
      href: "/",
      class: "navbar-brand navbar-brand-autodark d-none-navbar-horizontal",
    },
    brand.logo &&
      img({
        src: brand.logo,
        alt: "Logo",
        class: "navbar-brand-image mx-1",
        width: "32",
        height: "32",
      }),
    !config?.hide_site_name && brand.name
  );

const isNode = typeof window === "undefined";

const blockDispatch = (config) => ({
  pageHeader: ({ title, blurb }) =>
    div(
      h1(
        {
          class: `h3 mb-0 mt-2 text-${
            config.mode === "dark" ? "light" : "gray-800"
          }`,
        },
        title
      ),
      blurb &&
        p(
          {
            class: `mb-0 text-${config.mode === "dark" ? "light" : "gray-800"}`,
          },
          blurb
        )
    ),
  footer: ({ contents }) =>
    div(
      { class: "container-xl" },
      footer(
        { id: "footer" },
        div({ class: "row" }, div({ class: "col-sm-12" }, contents))
      )
    ),
  hero: ({ caption, blurb, cta, backgroundImage }) =>
    section(
      {
        class:
          "jumbotron text-center m-0 bg-info d-flex flex-column justify-content-center",
      },
      div(
        { class: "container-xl" },
        h1({ class: "jumbotron-heading" }, caption),
        p({ class: "lead" }, blurb),
        cta
      ),
      backgroundImage &&
        style(`.jumbotron {
        background-image: url("${backgroundImage}");
        background-size: cover;
        min-height: 75vh !important;
      }`)
    ),
  noBackgroundAtTop: () => true,
  wrapTop: (segment, ix, s) =>
    ["hero", "footer"].includes(segment.type) || segment.noWrapTop
      ? s
      : section(
          {
            class: [
              "page-section",
              "fw-check",
              ix === 0 && `pt-${config.toppad || 0}`,
              ix === 0 &&
                config.fixedTop &&
                config.layout_style !== "Vertical" &&
                isNode &&
                "mt-6",
              ix === 0 &&
                config.fixedTop &&
                config.layout_style !== "Vertical" &&
                !isNode &&
                "mt-5",
              segment.class,
              segment.invertColor && "bg-primary",
            ],
            style: `${
              segment.bgType === "Color"
                ? `background-color: ${segment.bgColor};`
                : ""
            }`,
          },
          div(
            { class: [config.fluid ? "container-fluid" : "container"] },
            segment.textStyle && segment.textStyle === "h1" ? h1(s) : s
          )
        ),
});

const renderBody = (title, body, alerts, config, role, req) =>
  renderLayout({
    blockDispatch: blockDispatch(config),
    role,
    req,
    layout:
      typeof body === "string" && config.in_card
        ? { type: "card", title, contents: body }
        : body,
    alerts,
  });

const wrapIt = (config, bodyAttr, headers, title, body, req) => {
  const primary =
    (config?.mode === "light"
      ? config?.primary_color_light
      : config?.mode === "dark"
      ? config?.primary_color_dark
      : config?.primary_color) || "#3b71ca";
  const secondary =
    (config?.mode === "light"
      ? config?.secondary_color_light
      : config?.mode === "dark"
      ? config?.secondary_color_dark
      : config?.secondary_color) || "#b1c6ea";

  const primary_rgb = hexToRgb(primary);
  const secondary_rgb = hexToRgb(secondary);

  const link_cover_color = adjustColor(primary, { l: -3 });
  const mdb_btn_color = adjustColor(primary, { l: +15 });
  const isRTL = req?.isRTL || false;
  const langCode = req?.getLocale?.() || "en";
  const cssFile = isRTL ? "mdb.rtl.min.css" : "mdb.min.css";
  return `<!doctype html>
<html lang="${langCode}" data-bs-theme="${config.mode || "light"}"${
    isRTL ? ' dir="rtl"' : ""
  }>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css">
    <!-- Google Fonts -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap">
    <!-- Material Design Bootstrap -->
    <link href="/plugins/public/material-design${verstring}/css/${cssFile}" rel="stylesheet">
    <!-- Plugin Custom Styles -->
    <link href="/plugins/public/material-design${verstring}/css/sidenav.css" rel="stylesheet">
    <!-- Material-design plugin overrides (ensure alternating table row colors in dark/light modes) -->
    <link href="/plugins/public/material-design${verstring}/css/table-rows.css" rel="stylesheet">
    ${headersInHead(headers)}
    <style>
    :root,
    [data-bs-theme="light"] {
      --mdb-primary: ${primary};
      --mdb-secondary: ${secondary};
      --mdb-primary-rgb: ${primary_rgb};
      --mdb-secondary-rgb: ${secondary_rgb};
      --mdb-link-hover-color: ${link_cover_color};
      --mdb-link-color-rgb: ${primary_rgb};
      --mdb-link-hover-color-rgb: ${link_cover_color};
      --mdb-primary-text-emphasis: ${adjustColor(primary, { l: -10 })};
      --mdb-primary-bg-subtle: ${adjustColor(primary, { l: +25 })};
    }
    [data-bs-theme="dark"] {
      --mdb-primary: ${primary};
      --mdb-secondary: ${secondary};
      --mdb-btn-color: ${mdb_btn_color};
      --mdb-link-hover-color: ${link_cover_color};
      --mdb-link-hover-color-rgb: ${link_cover_color};
      --mdb-secondary-text-emphasis: ${adjustColor(primary, { l: +65 })};
    }
    .btn-primary {
      --mdb-btn-hover-bg: ${link_cover_color};
      --mdb-btn-active-bg: ${link_cover_color};
      --mdb-btn-focus-bg: ${link_cover_color};
    }
    .btn-outline-primary {
      --mdb-btn-hover-bg: ${adjustColor(primary, { a: 0.1 })};
      --mdb-btn-hover-color: ${adjustColor(primary, { l: -5 })};
      --mdb-btn-focus-bg: ${adjustColor(primary, { l: +42 })};  
      --mdb-btn-focus-color: ${adjustColor(primary, { l: -5 })};
      --mdb-btn-active-bg: ${adjustColor(primary, { l: +42 })}; 
      --mdb-btn-active-color: ${adjustColor(primary, { l: -8 })};
      --mdb-btn-outline-focus-border-color: ${adjustColor(primary, { l: -10 })};
      --mdb-btn-outline-hover-border-color: ${adjustColor(primary, { l: -10 })};
    }
    [data-bs-theme="dark"] .btn-outline-primary {
      --mdb-btn-color: ${adjustColor(primary, { l: +15 })};
      --mdb-btn-hover-bg: ${adjustColor(primary, { l: -20, a: 0.9 })};
      --mdb-btn-hover-color: var(--mdb-btn-color);
      --mdb-btn-focus-bg: ${adjustColor(primary, { l: -50 })};
      --mdb-btn-focus-color: ${adjustColor(primary, { l: -5 })};
      --mdb-btn-active-bg: ${adjustColor(primary, { l: -50 })};
      --mdb-btn-active-color: ${adjustColor(primary, { l: -8 })};
      --mdb-btn-outline-hover-border-color: ${primary};
    }
    .btn-secondary {
      --mdb-btn-bg: ${adjustColor(secondary)};
      --mdb-btn-hover-bg: ${adjustColor(secondary, { l: +2 })};
      --mdb-btn-focus-bg: ${adjustColor(secondary, { l: +2 })};
      --mdb-btn-active-bg: ${adjustColor(secondary, { l: +2 })};
      --mdb-btn-color: ${adjustColor(secondary, { l: -50 })};
      --mdb-btn-hover-color: ${adjustColor(secondary, { l: -40 })};
      --mdb-btn-focus-color: ${adjustColor(secondary, { l: -40 })};
      --mdb-btn-active-color: ${adjustColor(secondary, { l: -40 })};
    }
    [data-bs-theme=dark] .btn-secondary {
      --mdb-btn-bg: ${adjustColor(secondary)};
      --mdb-btn-hover-bg: ${adjustColor(secondary, { l: +5 })};
      --mdb-btn-focus-bg: ${adjustColor(secondary, { l: +5 })};
      --mdb-btn-active-bg: ${adjustColor(secondary, { l: +5 })};
    }
    [data-bs-theme="light"] .btn-outline-secondary {
      --mdb-btn-color: ${adjustColor(secondary, { l: -20 })};
      --mdb-btn-hover-bg: ${adjustColor(secondary, { a: 0.1 })};
      --mdb-btn-hover-color: ${adjustColor(secondary, { l: -15 })};
      --mdb-btn-focus-bg: ${adjustColor(secondary, { a: 0.1 })};
      --mdb-btn-focus-color: ${adjustColor(secondary, { l: -15 })};
      --mdb-btn-active-bg: ${adjustColor(secondary, { a: 0.1 })};
      --mdb-btn-active-color: ${adjustColor(secondary, { l: -15 })};
      --mdb-btn-outline-border-color: ${secondary};
      --mdb-btn-outline-focus-border-color: ${adjustColor(secondary, {
        l: -2,
      })};
      --mdb-btn-outline-hover-border-color: ${adjustColor(secondary, {
        l: -2,
      })};
      --mdb-btn-active-border-color: ${adjustColor(secondary, { l: -5 })};
    }
    [data-bs-theme="dark"] .btn-outline-secondary {
      --mdb-btn-color: ${secondary};
      --mdb-btn-hover-bg: ${adjustColor(secondary, { l: -10, a: 0.1 })};
      --mdb-btn-hover-color: ${adjustColor(secondary, { l: -2 })};
      --mdb-btn-focus-bg: ${adjustColor(secondary, { l: -10, a: 0.1 })};
      --mdb-btn-focus-color: ${adjustColor(secondary, { l: -2 })};
      --mdb-btn-active-bg: ${adjustColor(secondary, { l: -10, a: 0.1 })};
      --mdb-btn-active-color: ${adjustColor(secondary, { l: -2 })};
      --mdb-btn-outline-border-color: ${secondary};
      --mdb-btn-outline-focus-border-color: ${adjustColor(secondary)};
      --mdb-btn-outline-hover-border-color: ${adjustColor(secondary)};
      --mdb-btn-active-border-color: ${adjustColor(secondary, { l: +25 })};
    }
    .dropdown-menu.dropdown-menu-end {
      max-width: fit-content;
    }
    /* Search component in "Page Configuration" */
    [data-bs-theme="dark"] input.form-control.bg-light {
      background-color: var(--mdb-dark) !important;
      color: var(--mdb-light) !important;
    }
    [data-bs-theme="dark"] .css-26l3qy-menu {
      background-color: var(--mdb-dark) !important;
      border: 1px solid var(--mdb-dark-border-subtle) !important;
    }
    [data-bs-theme="dark"] .css-yt9ioa-option:hover {
      background-color: #424242 !important;
      color: var(--mdb-light) !important;
    }
    [data-bs-theme="dark"] .css-1n7v3ny-option {
      background-color: #424242 !important;
    }
    [data-bs-theme="dark"] .css-yk16xz-control {
      background-color: #333;
      border-color: var(--mdb-dark-border-subtle) !important;
    }
    [data-bs-theme="dark"] .css-1pahdxg-control {
      background-color: #333 !important;
    }
    [data-bs-theme="dark"] .css-1uccc91-singleValue {
      color: #fefefe !important;
    }
    [data-bs-theme="dark"] .css-8mmkcg {
      fill: #ccc !important;
    }
    /* Icons selector */
    [data-bs-theme="dark"] .rfipbtn--default {
      background-color: var(--mdb-dark);
      border: 1px solid var(--mdb-dark-border-subtle);
    }
    [data-bs-theme="dark"] .rfipbtn--default .rfipbtn__button {
      border-left: 1px solid var(--mdb-dark-border-subtle);
      background-color: var(--mdb-dark-bg-subtle);
      color: #e0e0e0;
    }
    [data-bs-theme="dark"] .rfipbtn--default .rfipbtn__button:hover {
      background-color: var(--mdb-dark-bg-subtle);
      color: #e0e0e0;
    }
    [data-bs-theme="dark"] .rfipbtn--default:active,
    [data-bs-theme="dark"] .rfipbtn--default:focus {
      border: 1px solid var(--mdb-primary);
    }
    [data-bs-theme="dark"] .rfipdropdown--default {
      -webkit-box-shadow: 0 15px 24px rgba(0, 0, 0, .22), 0 19px 76px rgba(0, 0, 0, .3);
      box-shadow: 0 15px 24px rgba(0, 0, 0, .22), 0 19px 76px rgba(0, 0, 0, .3);
      color: var(--mdb-light);
      background-color: var(--mdb-dark);
      border: 1px solid var(--mdb-dark-border-subtle);
    }
    [data-bs-theme="dark"] .rfipdropdown--default input, .rfipdropdown--default select {
      color: var(--mdb-light);
    }
    [data-bs-theme="dark"] 
      .rfipdropdown--default .rfipicons__ibox,
    [data-bs-theme="dark"] 
      .rfipdropdown--default .rfipicons__left,
    [data-bs-theme="dark"] 
      .rfipdropdown--default .rfipicons__right {
      background-color: var(--mdb-dark-bg-subtle);
      border: 1px solid var(--mdb-dark-border-subtle);
      color: var(--mdb-light);
    }
    [data-bs-theme="dark"] 
      .rfipdropdown--default .rfipicons__ibox:hover,
    [data-bs-theme="dark"] 
      .rfipdropdown--default .rfipicons__left:hover,
    [data-bs-theme="dark"] 
      .rfipdropdown--default .rfipicons__right:hover {
      background-color: var(--mdb-dark);
      color: var(--mdb-light);
    }
    [data-bs-theme="dark"] 
    .rfipbtn--default .rfipbtn__icon {
      border: 1px solid #6a6a6a;
      color: var(--mdb-light);
    }
    [data-bs-theme="dark"] 
    .rfipbtn--default .rfipbtn__del {
      background-color: #6a6a6a;
    }  
    [data-bs-theme="dark"] 
    .rfipbtn--default .rfipbtn__del:hover {
        background-color: #8e8e8e;
    }
    [data-bs-theme="dark"] 
    .rfipdropdown--default .rfipicons__icon--selected .rfipicons__ibox {
      background-color: var(--mdb-primary);
    }
    /* Layers section single element hover class */
    [data-bs-theme="dark"]
    .bpkdMP {
      background: var(--mdb-dark);
    }
    .btn-outline-secondary:disabled, .btn-outline-secondary.disabled, fieldset:disabled .btn-outline-secondary {
      border-color: var(--mdb-btn-disabled-color) !important;
    }

    /* RTL Support */
    [dir="rtl"] .sidenav {
      right: 0;
      left: auto;
      border-right: none;
      border-left: 1px solid var(--mdb-border-color);
    }
    /* RTL: Body margin adjustment for vertical sidebar */
    [dir="rtl"] body:has(.sidenav) {
      margin-left: 0;
      margin-right: 280px;
    }
    /* RTL: Search bar border fix */
    [dir="rtl"] .search-bar input[type="search"]:not(.hasbl) {
      border-left: 1px solid #95a5a6;
      border-right: none;
    }
    [dir="rtl"] .search-bar button.search-bar {
      border-right: 1px solid #95a5a6 !important;
      border-left: none !important;
    }
    [dir="rtl"] .offcanvas-start {
      right: 0;
      left: auto;
      border-right: none;
      border-left: var(--mdb-offcanvas-border-width) solid var(--mdb-offcanvas-border-color);
      transform: translateX(100%);
    }
    [dir="rtl"] .offcanvas-start.showing, [dir="rtl"] .offcanvas-start.show {
      transform: none;
    }
    /* RTL: Remove margin on mobile */
    @media screen and (max-width: 992px) {
      [dir="rtl"] body:has(.sidenav) {
        margin-right: 0;
      }
    }
    [dir="rtl"] .dropdown-menu {
      text-align: right;
    }
    [dir="rtl"] .form-check {
      padding-right: 1.5em;
      padding-left: 0;
    }
    [dir="rtl"] .form-check-input {
      float: right;
      margin-right: -1.5em;
      margin-left: 0;
    }
    [dir="rtl"] .form-switch .form-check-input {
      margin-right: -2.5em;
    }
    
    section.page-section.fw-check:has(> .container > .full-page-width:first-child),
    section.page-section.fw-check:has(> .container-fluid > .full-page-width:first-child) {
      padding-top: 0 !important;
      margin-top: ${
        config.colorscheme === "" || config.colorscheme === "transparent-dark"
          ? "0"
          : "3.66rem"
      } !important;
    }

    /* Fixed-top navbar becomes overlay if first section is full-width */
    body:has(section.page-section.fw-check:first-of-type > .container > .full-page-width:first-child) .navbar.fixed-top,
    body:has(section.page-section.fw-check:first-of-type > .container-fluid > .full-page-width:first-child) .navbar.fixed-top {
      background: transparent;
      box-shadow: none !important;
    }

    body:has(section.page-section.fw-check:first-of-type > .container > .full-page-width:first-child) .navbar.fixed-top.scrolled,
    body:has(section.page-section.fw-check:first-of-type > .container-fluid > .full-page-width:first-child) .navbar.fixed-top.scrolled {
      backdrop-filter: blur(2px);
    }

    /* Navbar becomes overlay automatically if first section is full-width and navbar not fixed */
    body:has(section.page-section.fw-check:first-of-type > .container > .full-page-width:first-child) .navbar:not(.fixed-top),
    body:has(section.page-section.fw-check:first-of-type > .container-fluid > .full-page-width:first-child) .navbar:not(.fixed-top) {
      position: absolute;
      top: 0; left: 0; right: 0;
      z-index: 1050;
      background: transparent;
      box-shadow: none !important;
    }
    /* Scroll state */
    body:has(section.page-section.fw-check:first-of-type > .container > .full-page-width:first-child) .navbar:not(.fixed-top).scrolled,
    body:has(section.page-section.fw-check:first-of-type > .container-fluid > .full-page-width:first-child) .navbar:not(.fixed-top).scrolled {
      backdrop-filter: blur(2px);
    }

    /* Fixed-top full-width overlay (no box-shadow before scroll) */
    body:has(section.page-section.fw-check:first-of-type > .container > .full-page-width:first-child) .navbar.fixed-top.navbar-fw-first,
    body:has(section.page-section.fw-check:first-of-type > .container-fluid > .full-page-width:first-child) .navbar.fixed-top.navbar-fw-first {
      background: transparent;
      box-shadow: none !important;
    }

    body:has(section.page-section.fw-check:first-of-type > .container > .full-page-width:first-child) .navbar.fixed-top.navbar-fw-first.scrolled,
    body:has(section.page-section.fw-check:first-of-type > .container-fluid > .full-page-width:first-child) .navbar.fixed-top.navbar-fw-first.scrolled {
      backdrop-filter: blur(2px);
    }

    body:has(section.page-section.fw-check:first-of-type > .container > .full-page-width:first-child) .navbar:not(.fixed-top).navbar-fw-first,
    body:has(section.page-section.fw-check:first-of-type > .container-fluid > .full-page-width:first-child) .navbar:not(.fixed-top).navbar-fw-first {
      position: absolute;
      top: 0; left: 0; right: 0;
      z-index: 1050;
      background: transparent;
      box-shadow: none !important;
    }

    body:has(section.page-section.fw-check:first-of-type > .container > .full-page-width:first-child) .navbar:not(.fixed-top).navbar-fw-first.scrolled,
    body:has(section.page-section.fw-check:first-of-type > .container-fluid > .full-page-width:first-child) .navbar:not(.fixed-top).navbar-fw-first.scrolled {
      backdrop-filter: blur(2px);
    }

    /* Transparent variants (initial state before scroll) */
    .navbar.transparent-dark:not(.scrolled),
    .navbar.navbar-fw-first.transparent-dark:not(.scrolled) {
      background: transparent !important;
    }
    .navbar.transparent-dark:not(.scrolled) .navbar-nav .nav-link,
    .navbar.transparent-dark:not(.scrolled) .navbar-brand,
    .navbar.transparent-dark:not(.scrolled) .navbar-text,
    .navbar.transparent-dark:not(.scrolled) .nav-link {
      color: ${
        config.colorscheme === "transparent-dark" ? "#fff" : "#000"
      } !important;
    }
    /* Ensure toggler icon (if any) contrasts */
    .navbar.transparent-dark:not(.scrolled) .navbar-toggler {
      border-color: rgba(255,255,255,.4);
    }
    .navbar.transparent-dark:not(.scrolled) .navbar-toggler-icon {
      filter: invert(1) brightness(1.2);
    }
      
    /* fixed-top stays fixed; only non fixed-top made absolute */
    body:has(section.page-section.fw-check:first-of-type > .container > .full-page-width:first-child)
      .navbar.fixed-top.navbar-fw-first:not(.scrolled),
    body:has(section.page-section.fw-check:first-of-type > .container-fluid > .full-page-width:first-child)
      .navbar.fixed-top.navbar-fw-first:not(.scrolled) {
      background: transparent;
      box-shadow: none !important;
    }
    body:has(section.page-section.fw-check:first-of-type > .container > .full-page-width:first-child)
      .navbar:not(.fixed-top).navbar-fw-first:not(.scrolled),
    body:has(section.page-section.fw-check:first-of-type > .container-fluid > .full-page-width:first-child)
      .navbar:not(.fixed-top).navbar-fw-first:not(.scrolled) {
      background: transparent;
      box-shadow: none !important;
      position: absolute;
      top: 0; left: 0; right: 0;
      z-index: 1050;
    }

    /* Scrolled state subtle backdrop for transparent variants */
    .navbar.navbar-fw-first.scrolled {
      backdrop-filter: ${config.fixedTop ? "blur(2px)" : "none"};
    }
    </style>
    <title>${text(title)}</title>
  </head>
  <body ${bodyAttr} class="${config.mode === "dark" ? "bg-dark" : ""} ${
    config.fluid ? "fluid" : ""
  } ${config.fixedTop ? "fixed-top-layout" : "no-fixed-top-layout"} ${
    config.layout_style === "Vertical" ? "layout-vertical" : "layout-horizontal"
  }">
    ${body}
      <script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
    <script type="text/javascript" src="/plugins/public/material-design${verstring}/js/popper.min.js"></script>
    <!-- MDB core JavaScript -->
    <script type="text/javascript" src="/plugins/public/material-design${verstring}/js/mdb.min.js"></script>
    <script type="text/javascript" src="/plugins/public/material-design${verstring}/js/reinit-dropdowns.js"></script>
    <!-- Bind window.mdb to window.bootstrap for backward compatibility -->
    <script>
      window.bootstrap = window.mdb;
      config = ${JSON.stringify(config || {})};
      const navbar = document.querySelector(".navbar");

      (function () {
        const firstFullWidth = document.querySelector(
          "section.page-section.fw-check > .container > .full-page-width:first-child, \
                section.page-section.fw-check > .container-fluid > .full-page-width:first-child"
        );
        const isTransparent =
          config.colorscheme === "" || config.colorscheme === "transparent-dark";
        const isImplicitTransparentDark =
          config.colorscheme === "" && config.mode === "dark";

        if (firstFullWidth && navbar && isTransparent) {
          navbar.classList.add("navbar-fw-first");
          // If we are in dark mode with empty colorscheme, force transparent-dark styling
          if (isImplicitTransparentDark) navbar.classList.add("transparent-dark");

          // Initial theme
          if (config.mode === "dark" || config.colorscheme === "transparent-dark") {
            navbar.classList.add("navbar-dark");
            navbar.classList.remove("navbar-light");
          } else {
            navbar.classList.add("navbar-light");
            navbar.classList.remove("navbar-dark");
          }

          const topHeight = firstFullWidth.parentElement.parentElement.clientHeight;

          const applyScrolledTheme = () => {
            if (config.mode === "dark") {
              navbar.classList.add("navbar-dark");
              navbar.classList.remove("navbar-light");
              // Keep transparent-dark class only if explicitly chosen; implicit variant can stay (harmless)
            } else {
              navbar.classList.add("navbar-light");
              navbar.classList.remove("navbar-dark");
            }
          };

          const onScroll = () => {
            const y = window.scrollY || window.pageYOffset;
            if (y >= topHeight) {
              navbar.classList.add("scrolled");
              applyScrolledTheme();
            } else {
              navbar.classList.remove("scrolled");
              // Revert to initial transparent intent
              if (
                config.mode === "dark" ||
                config.colorscheme === "transparent-dark"
              ) {
                navbar.classList.add("navbar-dark");
                navbar.classList.remove("navbar-light");
                if (isImplicitTransparentDark)
                  navbar.classList.add("transparent-dark");
              } else {
                navbar.classList.add("navbar-light");
                navbar.classList.remove("navbar-dark");
              }
            }
          };
          window.addEventListener("scroll", onScroll, { passive: true });
          onScroll();
        } else if (navbar && isTransparent) {
          // No full-width hero
          navbar.classList.add("navbar-fw-first", "scrolled");
          if (isImplicitTransparentDark) navbar.classList.add("transparent-dark");
          if (config.mode === "dark") {
            navbar.classList.add("navbar-dark");
            navbar.classList.remove("navbar-light");
          } else {
            navbar.classList.add("navbar-light");
            navbar.classList.remove("navbar-dark");
          }
        } else if (firstFullWidth && navbar && !isTransparent) {
          // Non-transparent navbar
          const sec = firstFullWidth.parentElement.parentElement;
          const navH = navbar.offsetHeight;
          if (!sec.style.marginTop) sec.style.marginTop = navH + "px";
        }

        if (!CSS.supports("selector(:has(*))")) {
          document
            .querySelectorAll("section.page-section.fw-check")
            .forEach((sec) => {
              const fw = sec.querySelector(
                ":scope > .container > .full-page-width:first-child, :scope > .container-fluid > .full-page-width:first-child"
              );
              if (fw && isTransparent && navbar) {
                if (!navbar.classList.contains("fixed-top")) {
                  navbar.style.position = "absolute";
                  navbar.style.top = "0";
                  navbar.style.left = "0";
                  navbar.style.right = "0";
                }
                navbar.classList.add("navbar-fw-first");
                navbar.style.background = "transparent";
                navbar.style.boxShadow = "none";
              } else if (fw && !isTransparent && navbar) {
                const navH = navbar.offsetHeight;
                const parentSec = fw.parentElement.parentElement;
                if (!parentSec.style.marginTop)
                  parentSec.style.marginTop = navH + "px";
              }
            });
        }
      })();
    </script>
    <script type="text/javascript" src="/plugins/public/material-design${verstring}/js/mdb-jquery-bridge.js"></script>
    <script>
      // Enable hover for nested dropdowns in horizontal navbar and vertical sidebar
      (function () {
        const allDropdowns = document.querySelectorAll(
          ".navbar .hover-dropdown-item, .sidenav .hover-dropdown-item"
        );

        allDropdowns.forEach(function (dropdownItem) {
          let hoverTimer;
          const dropdownMenu = dropdownItem.querySelector(".hover-dropdown-menu");
          const dropdownToggle = dropdownItem.querySelector(
            '[data-bs-toggle="dropdown"]'
          );

          if (!dropdownMenu || !dropdownToggle) return;

          // Show on hover
          dropdownItem.addEventListener("mouseenter", function () {
            clearTimeout(hoverTimer);
            hoverTimer = setTimeout(function () {
              const bsDropdown =
                window.mdb.Dropdown.getInstance(dropdownToggle) ||
                new window.mdb.Dropdown(dropdownToggle);
              bsDropdown.show();
            }, 100);
          });

          // Hide on mouse leave
          dropdownItem.addEventListener("mouseleave", function () {
            clearTimeout(hoverTimer);
            hoverTimer = setTimeout(function () {
              const bsDropdown = window.mdb.Dropdown.getInstance(dropdownToggle);
              if (bsDropdown) {
                bsDropdown.hide();
              }
            }, 200);
          });

          // Keep open when hovering over the menu itself
          dropdownMenu.addEventListener("mouseenter", function () {
            clearTimeout(hoverTimer);
          });

          dropdownMenu.addEventListener("mouseleave", function () {
            clearTimeout(hoverTimer);
            hoverTimer = setTimeout(function () {
              const bsDropdown = window.mdb.Dropdown.getInstance(dropdownToggle);
              if (bsDropdown) {
                bsDropdown.hide();
              }
            }, 200);
          });
        });
      })();
    </script>

    ${headersInBody(headers)}
    ${config.colorscheme === "navbar-light" ? navbarSolidOnScroll : ""}
  </body>
</html>`;
};

const header_sections = (brand, sections, currentUrl, config, user, title) => {
  if (!sections && !brand) return "";
  const { primary, secondary } = splitPrimarySecondaryMenu(sections || []);

  switch (config?.layout_style) {
    case "Vertical":
      return vertical_header_sections(
        brand,
        primary,
        secondary,
        currentUrl,
        config,
        user
      );

    default: //Horizontal
      return horizontal_header_sections(
        brand,
        primary,
        secondary,
        currentUrl,
        config,
        user,
        title
      );
  }
};

const vertical_sidebar_sections = (
  brand,
  primary,
  secondary,
  currentUrl,
  config,
  user
) =>
  (brand &&
    a(
      {
        href: "/",
        class: "d-flex p-3 align-items-center text-decoration-none fs-4",
      },
      brand.logo &&
        img({
          src: brand.logo,
          alt: "Logo",
          class: "me-2 object-fit-contain",
          width: "32",
          height: "32",
        }),
      (!config?.hide_site_name || !brand.logo) && brand.name
    )) +
  horizontalLineItem() +
  ul(
    {
      class: "nav w-100 flex-column flex-nowrap overflow-y-auto",
    },
    [...primary].map(sideBarSection(currentUrl, config, user))
  ) +
  horizontalLineItem(["mt-auto"]) +
  ul(
    { class: "nav w-100 flex-column flex-nowrap" },
    [...secondary].map(sideBarSection(currentUrl, config, user))
  );

const vertical_header_sections = (
  brand,
  primary,
  secondary,
  currentUrl,
  config,
  user
) =>
  aside(
    {
      class: [
        "sidenav sidenav-zIndex shadow position-fixed top-0 start-0 p-1 d-none d-lg-flex flex-column flex-shrink-0 bg-body-subtle border-end overflow-y-auto",
        config?.colorscheme && config.colorscheme.toLowerCase(),
      ],
      ...(config?.colorscheme.includes("sidenav-dark") && {
        "data-bs-theme": "dark",
      }),
      ...(config?.colorscheme.includes("sidenav-light") && {
        "data-bs-theme": "light",
      }),
    },
    vertical_sidebar_sections(
      brand,
      primary,
      secondary,
      currentUrl,
      config,
      user
    )
  ) +
  div(
    { class: ["offcanvas offcanvas-start"], tabindex: "-1", id: "sidebar" },
    aside(
      {
        class: [
          "sidenav offcanvas-body p-1 d-flex d-lg-none flex-column flex-shrink-0 bg-body-subtle border-end overflow-y-auto",
          config?.colorscheme && config.colorscheme.toLowerCase(),
        ],
        ...(config?.colorscheme.includes("sidenav-dark") && {
          "data-bs-theme": "dark",
        }),
        ...(config?.colorscheme.includes("sidenav-light") && {
          "data-bs-theme": "light",
        }),
      },
      vertical_sidebar_sections(
        brand,
        primary,
        secondary,
        currentUrl,
        config,
        user
      )
    )
  ) +
  header(
    {
      class: [
        "navbar navbar-expand-lg d-lg-none",
        config?.colorscheme && config.colorscheme.toLowerCase(),
      ],
      ...(config?.colorscheme.includes("sidenav-dark") && {
        "data-bs-theme": "dark",
      }),
      ...(config?.colorscheme.includes("sidenav-light") && {
        "data-bs-theme": "light",
      }),
    },
    div(
      { class: "container-xl" },
      button(
        {
          class: "navbar-toggler",
          type: "button",
          "data-bs-toggle": "offcanvas",
          "data-bs-target": "#sidebar",
        },
        span({ class: "navbar-toggler-icon" })
      ),
      brand && showBrand(brand, config),
      div(
        { class: "navbar-nav flex-row order-lg-last" },
        secondary.map(sideBarSection(currentUrl, config, user))
      )
    )
  );

const authBrand = (config, { name, logo }) =>
  logo
    ? `<img class="mb-4" src="${logo}" alt="Logo" width="72" height="72">`
    : "";

const layout = (config) => ({
  wrap: ({
    title,
    menu,
    brand,
    alerts,
    currentUrl,
    body,
    headers,
    role,
    req,
  }) =>
    wrapIt(
      config,
      'id="page-top"',
      headers,
      title,
      `
      <div id="wrapper">
      ${header_sections(brand, menu, currentUrl, config, req?.user, title)}
        <div class="${config.fluid ? "container-fluid" : "container-xl"}">
          <div class="row">
            <div class="col-sm-12" id="page-inner-content">
              ${renderBody(title, body, alerts, config, role, req)}
            </div>
          </div>
        </div>
    </div>
    `,
      req
    ),
  renderBody: ({ title, body, alerts, role, req }) =>
    renderBody(title, body, alerts, config, role, req),
  authWrap: ({
    title,
    alerts, //TODO
    form,
    afterForm,
    headers,
    brand,
    csrfToken,
    authLinks,
  }) =>
    wrapIt(
      config,
      'class="text-center"',
      headers,
      title,
      `
  <div class="form-signin">
    ${alerts.map((a) => alert(a.type, a.msg)).join("")}
    ${authBrand(config, brand)}
    <h3>
      ${title}
    </h3>
    ${renderForm(formModify(form), csrfToken)}
    ${renderAuthLinks(authLinks)}
    ${afterForm}
    <style>
    html,
body {
  height: 100%;
}

body {
  display: -ms-flexbox;
  display: -webkit-box;
  display: flex;
  -ms-flex-align: center;
  -ms-flex-pack: center;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  padding-top: 40px;
  padding-bottom: 40px;
  /* background-color: #f5f5f5; */
}

.form-signin {
  width: 100%;
  max-width: 330px;
  padding: 15px;
  margin: 0 auto;
}
.form-signin .checkbox {
  font-weight: 400;
}
.form-signin .form-control {
  position: relative;
  box-sizing: border-box;
  height: auto;
  padding: 10px;
  font-size: 16px;
}
.form-signin .form-control:focus {
  z-index: 2;
}
.form-signin input[type="email"] {
  margin-bottom: -1px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.form-signin input[type="password"] {
  margin-bottom: 10px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
    </style>
  </div>
  `
    ),
});
const renderAuthLinks = (authLinks) => {
  var links = [];
  if (authLinks.login)
    links.push(link(authLinks.login, "Already have an account? Login!"));
  if (authLinks.forgot) links.push(link(authLinks.forgot, "Forgot password?"));
  if (authLinks.signup)
    links.push(link(authLinks.signup, "Create an account!"));
  const meth_links = (authLinks.methods || [])
    .map(({ url, icon, label }) =>
      a(
        { href: url, class: "btn btn-secondary btn-user btn-block mb-1" },
        icon || "",
        `&nbsp;Login with ${label}`
      )
    )
    .join("");

  return (
    meth_links + links.map((l) => div({ class: "text-center" }, l)).join("")
  );
};

const horizontal_header_sections = (
  brand,
  primary,
  secondary,
  currentUrl,
  config,
  user,
  title
) => {
  const renderNestedDropdown = (item, parentId, subIx) => {
    if (!item.subitems || !item.subitems.length) {
      return a(
        {
          class: "dropdown-item",
          href: text(item.link || "#"),
          ...(item.tooltip
            ? {
                "data-bs-toggle": "tooltip",
                "data-bs-placement": "left",
                "data-mdb-placement": "left",
                "data-mdb-original-title": item.tooltip,
                "data-bs-original-title": item.tooltip,
                "data-mdb-tooltip-initialized": "true",
                "data-bs-tooltip-initialized": "true",
              }
            : {}),
        },
        item.icon &&
          item.icon !== "empty" &&
          item.icon !== "undefined" &&
          i({ class: `fa-fw mr-05 ${item.icon}` }),
        item.label
      );
    }
    return div(
      {
        class: "dropdown-item dropstart hover-dropdown-item",
      },
      a(
        {
          type: "button",
          class: "dropdown-item dropdown-toggle p-0",
          "data-bs-toggle": "dropdown",
          "aria-expanded": "false",
          "data-mdb-dropdown-initialized": "true",
          "data-bs-dropdown-initialized": "true",
        },
        item.label
      ),
      ul(
        { class: "dropdown-menu hover-dropdown-menu" },
        item.subitems.map((subitem, subsubIx) =>
          li(renderNestedDropdown(subitem, `${parentId}_${subIx}`, subsubIx))
        )
      )
    );
  };

  return nav(
    {
      class: [
        "navbar d-print-none navbar-expand-md",
        config?.fixedTop && "fixed-top",
        config?.colorscheme && config.colorscheme.toLowerCase(),
      ],
      id: "mainNav",
      ...(config?.colorscheme?.includes("navbar-dark") && {
        "data-bs-theme": "dark",
      }),
      ...(config?.colorscheme?.includes("navbar-light") && {
        "data-bs-theme": "light",
      }),
    },
    div(
      { class: "container" },
      brand &&
        a(
          { class: "navbar-brand js-scroll-trigger", href: "/" },
          brand.logo
            ? img({
                src: brand.logo,
                alt: "Logo",
                width: "30",
                height: "30",
                class: "navbar-brand-image mx-1",
              })
            : "",
          (!config?.hide_site_name || !brand.logo) && brand.name
        ),
      button(
        {
          class: "navbar-toggler navbar-toggler-right collapsed",
          type: "button",
          "data-bs-toggle": "collapse",
          "data-bs-target": "#navbarResponsive",
          "aria-controls": "navbarResponsive",
          "aria-expanded": "false",
          "aria-label": "Toggle navigation",
        },
        span({ class: "navbar-toggler-icon" })
      ),

      div(
        {
          class: ["collapse navbar-collapse"],
          id: "navbarResponsive",
          "data-mdb-collapse-initialized": "true",
          "data-bs-collapse-initialized": "true",
        },
        ul(
          { class: "navbar-nav ms-auto my-2 my-lg-0" },
          [...primary]
            .map((section) => section.items)
            .flat()
            .map((item, ix) => {
              if (item.type === "Separator")
                return li({ class: "nav-item" }, div({ class: "vr mx-2" }));
              if (item.subitems && item.subitems.length)
                return li(
                  { class: "nav-item dropdown" },
                  a(
                    {
                      class: [
                        "nav-link dropdown-toggle",
                        active(currentUrl, item) && "active",
                      ],
                      href: "#",
                      id: `dropdown_primary_${ix}`,
                      role: "button",
                      "data-bs-toggle": "dropdown",
                      "aria-haspopup": "true",
                      "aria-expanded": "false",
                      "data-bs-auto-close": "outside",
                      "data-mdb-dropdown-initialized": "true",
                      "data-bs-dropdown-initialized": "true",
                    },
                    item.icon &&
                      item.icon !== "empty" &&
                      item.icon !== "undefined" &&
                      i({ class: `fa-fw mr-05 ${item.icon}` }),
                    item.label
                  ),
                  div(
                    {
                      class: "dropdown-menu",
                      "aria-labelledby": `dropdown_primary_${ix}`,
                    },
                    item.subitems.map((subitem, subIx) =>
                      renderNestedDropdown(
                        subitem,
                        `dropdown_primary_${ix}`,
                        subIx
                      )
                    )
                  )
                );

              return li(
                {
                  class: [
                    "nav-item",
                    active(currentUrl, item) && "active",
                    item.style && item.style.includes("btn") && "nav-item-btn",
                  ],
                },
                a(
                  {
                    class: ["nav-link js-scroll-trigger", item.style || ""],
                    href: text(item.link || "#"),
                    ...(item.tooltip
                      ? {
                          "data-bs-toggle": "tooltip",
                          "data-bs-placement": "bottom",
                          "data-mdb-placement": "bottom",
                          "data-mdb-original-title": item.tooltip,
                          "data-bs-original-title": item.tooltip,
                          "data-mdb-tooltip-initialized": "true",
                          "data-bs-tooltip-initialized": "true",
                        }
                      : {}),
                  },
                  item.icon &&
                    item.icon !== "empty" &&
                    item.icon !== "undefined" &&
                    i({ class: `fa-fw mr-05 ${item.icon}` }),
                  item.label
                )
              );
            })
            .concat(
              [...secondary]
                .map((section) => section.items)
                .flat()
                .map((item, ix) => {
                  if (item.subitems && item.subitems.length)
                    return li(
                      { class: "nav-item dropdown" },
                      a(
                        {
                          class: [
                            "nav-link dropdown-toggle user-nav-section",
                            active(currentUrl, item) && "active",
                          ],
                          href: "#",
                          id: `dropdown_secondary_${ix}`,
                          role: "button",
                          "data-bs-toggle": "dropdown",
                          "aria-haspopup": "true",
                          "aria-expanded": "false",
                          "data-bs-auto-close": "outside",
                          "data-mdb-dropdown-initialized": "true",
                          "data-bs-dropdown-initialized": "true",
                        },
                        item.icon &&
                          item.icon !== "empty" &&
                          item.icon !== "undefined" &&
                          i({ class: `fa-fw mr-05 ${item.icon}` }),
                        item.label
                      ),
                      div(
                        {
                          class: "dropdown-menu dropdown-menu-end",
                          "aria-labelledby": `dropdown_secondary_${ix}`,
                        },
                        item.subitems.map((subitem, subIx) =>
                          renderNestedDropdown(
                            subitem,
                            `dropdown_secondary_${ix}`,
                            subIx
                          )
                        )
                      )
                    );

                  return li(
                    { class: "nav-item" },
                    a(
                      {
                        class: [
                          "nav-link js-scroll-trigger",
                          active(currentUrl, item) && "active",
                        ],
                        href: text(item.link || "#"),
                      },
                      item.icon &&
                        item.icon !== "empty" &&
                        item.icon !== "undefined" &&
                        i({ class: `fa-fw mr-05 ${item.icon}` }),
                      item.label
                    )
                  );
                })
            )
        )
      )
    )
  );
};

const formModify = (form) => {
  form.formStyle = "vert";
  form.submitButtonClass = "btn-primary btn-user btn-block";
  return form;
};

const user_config_form = (ctx) => {
  return new Form({
    fields: [
      {
        name: "mode",
        label: "Mode",
        type: "String",
        required: true,
        default: ctx?.mode || "light",
        attributes: {
          options: [
            { name: "light", label: "Light" },
            { name: "dark", label: "Dark" },
          ],
        },
      },
    ],
  });
};

const configuration_workflow = (config) =>
  new Workflow({
    onDone: (ctx) => {
      ctx.backgroundColorDark = "#424242";
      return ctx;
    },
    steps: [
      {
        name: "stylesheet",
        form: async () => {
          return new Form({
            fields: [
              {
                name: "in_card",
                label: "Default content in card?",
                type: "Bool",
                required: true,
              },
              {
                name: "colorscheme",
                label: "Sidebar color scheme",
                type: "String",
                required: true,
                default: "",
                attributes: {
                  options: [
                    { name: "", label: "Default" },
                    { name: "sidenav-dark bg-dark", label: "Dark" },
                    { name: "sidenav-dark bg-primary", label: "Dark Primary" },
                    {
                      name: "sidenav-dark bg-secondary",
                      label: "Dark Secondary",
                    },
                    { name: "sidenav-light bg-light", label: "Light" },
                    { name: "sidenav-light bg-white", label: "White" },
                    { name: "sidenav-light", label: "Transparent Light" },
                    {
                      name: "sidenav-light navbar-scrolling bg-light",
                      label: "Scrolling Light",
                    },
                    {
                      name: "sidenav-dark navbar-scrolled bg-dark",
                      label: "Scrolled Dark",
                    },
                  ],
                },
                showIf: { layout_style: "Vertical" },
              },
              {
                name: "colorscheme",
                label: "Navbar color scheme",
                type: "String",
                required: true,
                default: "",
                attributes: {
                  options: [
                    { name: "", label: "Default" },
                    { name: "navbar-dark bg-dark", label: "Dark" },
                    { name: "navbar-dark bg-primary", label: "Dark Primary" },
                    {
                      name: "navbar-dark bg-secondary",
                      label: "Dark Secondary",
                    },
                    { name: "navbar-light bg-light", label: "Light" },
                    { name: "navbar-light bg-white", label: "White" },
                    { name: "", label: "Transparent Light" },
                    { name: "transparent-dark", label: "Transparent Dark" },
                    {
                      name: "navbar-scrolling bg-light",
                      label: "Scrolling Light",
                    },
                    { name: "navbar-scrolled bg-dark", label: "Scrolled Dark" },
                  ],
                },
                showIf: { layout_style: "Horizontal" },
              },
              {
                name: "fixedTop",
                label: "Navbar Fixed Top",
                type: "Bool",
                required: true,
                showIf: { layout_style: "Horizontal" },
              },
              {
                name: "fluid",
                label: "Fluid",
                type: "Bool",
              },
              {
                name: "mode",
                label: "Mode",
                type: "String",
                required: true,
                default: "light",
                attributes: {
                  options: [
                    { name: "light", label: "Light" },
                    { name: "dark", label: "Dark" },
                  ],
                },
              },
              {
                name: "layout_style",
                label: "Layout style",
                type: "String",
                required: true,
                attributes: {
                  inline: true,
                  options: ["Horizontal", "Vertical"],
                },
              },
              {
                name: "toppad",
                label: "Top padding",
                sublabel: "0-5 depending on Navbar height and configuration",
                type: "Integer",
                required: true,
                default: 2,
                attributes: {
                  max: 5,
                  min: 0,
                },
              },
              {
                name: "primary_color_light",
                label: "Primary Color </br>(Light Mode)",
                type: "Color",
                default: "#3b71ca",
                required: false,
              },
              {
                name: "secondary_color_light",
                label: "Secondary Color </br>(Light Mode)",
                type: "Color",
                default: "#b1c6ea",
                required: false,
              },
              {
                name: "primary_color_dark",
                label: "Primary Color </br>(Dark Mode)",
                type: "Color",
                default: "#3b71ca",
                required: false,
              },
              {
                name: "secondary_color_dark",
                label: "Secondary Color </br>(Dark Mode)",
                type: "Color",
                default: "#b1c6ea",
                required: false,
              },
            ],
          });
        },
      },
    ],
  });

module.exports = {
  sc_plugin_api_version: 1,
  layout,
  configuration_workflow,
  user_config_form,
  plugin_name: "material-design",
  actions: () => ({
    toggle_material_dark_mode: {
      description: "Switch between dark and light mode",
      configFields: [],
      run: async ({ user, req }) => {
        let plugin = await Plugin.findOne({ name: "material-design" });
        if (!plugin) {
          plugin = await Plugin.findOne({
            name: "@saltcorn/material-design",
          });
        }
        const dbUser = await User.findOne({ id: user.id });
        const attrs = dbUser._attributes || {};
        const userLayout = attrs.layout || {
          config: {},
        };
        userLayout.plugin = plugin.name;
        const currentMode = userLayout.config.mode
          ? userLayout.config.mode
          : plugin.configuration?.mode
          ? plugin.configuration.mode
          : "light";
        userLayout.config.mode = currentMode === "dark" ? "light" : "dark";
        userLayout.config.is_user_config = true;
        attrs.layout = userLayout;
        await dbUser.update({ _attributes: attrs });
        await db.commitAndBeginNewTransaction?.();
        await getState().refreshUserLayouts?.();
        await dbUser.relogin(req);
        return { reload_page: true };
      },
    },
  }),
};
