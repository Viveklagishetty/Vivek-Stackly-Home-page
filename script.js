/* Only these addresses open a real page. Any other address (About, Services,
   Blog, Contact, Shop, ...) is sent to the 404 page. */
var pageIds = {
  "/": "home",
  "/login": "login",
  "/signup": "signup",
  "/dashboard": "dashboard",
  "/admin": "admin",
  "/404": "notfound"
};

var pageTitles = {
  "/": "The farm marketplace",
  "/login": "Log in",
  "/signup": "Sign up",
  "/dashboard": "My dashboard",
  "/admin": "Admin panel",
  "/404": "Page not found"
};

var barePages = ["/login", "/signup", "/404", "/admin", "/dashboard"];

var currentUser = null;
var pageLoaded = false;

window.addEventListener("load", function () {
  pageLoaded = true;
});

function getSavedUsers() {
  try {
    return JSON.parse(localStorage.getItem("stackly_users")) || {};
  } catch (error) {
    return {};
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem("stackly_users", JSON.stringify(users));
  } catch (error) {}
}

function getSavedLogin() {
  try {
    var user = JSON.parse(localStorage.getItem("stackly_login"));

    if (user && !user.role) {
      user.role = "user";
    }

    return user;
  } catch (error) {
    return null;
  }
}

function saveLogin(user) {
  try {
    if (user) {
      localStorage.setItem("stackly_login", JSON.stringify(user));
    } else {
      localStorage.removeItem("stackly_login");
    }
  } catch (error) {}
}

function homeFor(user) {
  if (user.role === "admin") {
    return "/admin";
  }

  return "/dashboard";
}

function redirectTo(path) {
  history.replaceState(null, "", "#" + path);
  return path;
}

function getSelectedRole(radioName) {
  return document.querySelector('input[name="' + radioName + '"]:checked').value;
}

function showMessage(text) {
  var toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");

  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2600);
}

function startLoader() {
  var loader = document.getElementById("loader");
  var alreadySeen = false;

  try {
    alreadySeen = sessionStorage.getItem("stackly_seen") === "yes";
  } catch (error) {}

  if (alreadySeen) {
    loader.style.display = "none";
    return;
  }

  var percent = 0;
  var startTime = Date.now();
  var bar = document.getElementById("loaderBar");
  var percentText = document.getElementById("loaderPercent");
  var messageText = document.getElementById("loaderText");

  var timer = setInterval(function () {
    var waited = Date.now() - startTime;
    var readyToFinish = (pageLoaded && waited > 1500) || waited > 8000;
    var limit = 90;

    if (readyToFinish) {
      limit = 100;
    }

    percent = Math.min(limit, percent + 1 + Math.random() * 3);
    bar.style.width = percent + "%";
    percentText.textContent = Math.floor(percent) + "%";

    if (percent < 30) {
      messageText.textContent = "Preparing the market...";
    } else if (percent < 60) {
      messageText.textContent = "Stocking the shelves...";
    } else if (percent < 90) {
      messageText.textContent = "Checking the produce...";
    } else {
      messageText.textContent = "Welcome in!";
    }

    if (percent >= 100) {
      clearInterval(timer);

      try {
        sessionStorage.setItem("stackly_seen", "yes");
      } catch (error) {}

      setTimeout(function () {
        loader.classList.add("hide");
      }, 250);
    }
  }, 45);
}

function closeMenu() {
  document.getElementById("navPanel").classList.remove("open");
  document.body.classList.remove("menu-open");
}

function toggleMenu() {
  var panel = document.getElementById("navPanel");
  var isOpen = panel.classList.toggle("open");

  document.body.classList.toggle("menu-open", isOpen);
}

function updateNavbar(path) {
  var links = document.querySelectorAll("#navLinks a");

  links.forEach(function (link) {
    if (link.getAttribute("href") === "#" + path) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  if (currentUser) {
    var spaceLink = document.getElementById("spaceLink");

    document.body.classList.add("logged-in");
    spaceLink.href = "#" + homeFor(currentUser);

    if (currentUser.role === "admin") {
      document.getElementById("spaceLabel").textContent = "Admin panel";
    } else {
      document.getElementById("spaceLabel").textContent = "Dashboard";
    }
  } else {
    document.body.classList.remove("logged-in");
  }

  closeMenu();

  if (window.settleNav) {
    window.settleNav();
  }
}

function showPage() {
  var path = location.hash.slice(1);

  if (path === "") {
    path = "/";
  }

  if (currentUser && (path === "/login" || path === "/signup")) {
    path = redirectTo(homeFor(currentUser));
  }

  if (path === "/dashboard" || path === "/admin") {
    if (!currentUser) {
      path = redirectTo("/login");
    } else if (path === "/admin" && currentUser.role !== "admin") {
      path = redirectTo("/dashboard");
    } else if (path === "/dashboard" && currentUser.role === "admin") {
      path = redirectTo("/admin");
    }
  }

  if (!pageIds[path]) {
    document.getElementById("badPath").textContent = path;
    history.replaceState(null, "", "#/404");
    path = "/404";
  }

  document.querySelectorAll(".page").forEach(function (page) {
    page.classList.remove("show");
  });

  document.getElementById(pageIds[path]).classList.add("show");

  if (barePages.indexOf(path) !== -1) {
    document.body.classList.add("no-bars");
  } else {
    document.body.classList.remove("no-bars");
  }

  if (path === "/admin" && currentUser) {
    var adminName = currentUser.name || "Admin";
    document.getElementById("adminUserName").textContent = adminName;
    document.getElementById("adminHeroName").textContent = adminName + ".";
    document.getElementById("adminAvatar").textContent = adminName.charAt(0).toUpperCase();
  }

  if (path === "/dashboard" && currentUser) {
    var userName = currentUser.name || "User";
    document.getElementById("userUserName").textContent = userName;
    document.getElementById("userHeroName").textContent = userName + ".";
    document.getElementById("userAvatar").textContent = userName.charAt(0).toUpperCase();
  }

  document.title = pageTitles[path] + " | Stackly";
  updateNavbar(path);
  window.scrollTo(0, 0);
}

function changePage() {
  var topbar = document.getElementById("topbar");
  topbar.style.width = "70%";

  setTimeout(function () {
    showPage();
    topbar.style.width = "100%";

    setTimeout(function () {
      topbar.style.opacity = "0";

      setTimeout(function () {
        topbar.style.width = "0";
        topbar.style.opacity = "1";
      }, 300);
    }, 200);
  }, 300);
}

function showError(inputId, message) {
  var input = document.getElementById(inputId);
  var errorBox = document.getElementById(inputId + "Error");

  errorBox.textContent = message;

  if (message === "") {
    input.classList.remove("has-error");
  } else {
    input.classList.add("has-error");
  }
}

function isValidEmail(email) {
  var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

function finishLogin(user, message) {
  currentUser = user;
  saveLogin(user);
  showMessage(message);
  location.hash = "#" + homeFor(user);
}

function handleSignup(event) {
  event.preventDefault();

  var name = document.getElementById("signupName").value.trim();
  var email = document.getElementById("signupEmail").value.trim().toLowerCase();
  var password = document.getElementById("signupPassword").value;
  var hasError = false;

  showError("signupName", "");
  showError("signupEmail", "");
  showError("signupPassword", "");

  if (name.length < 2) {
    showError("signupName", "Enter your full name.");
    hasError = true;
  }

  if (!isValidEmail(email)) {
    showError("signupEmail", "Enter a valid email address.");
    hasError = true;
  }

  if (password.length < 8) {
    showError("signupPassword", "Use at least 8 characters.");
    hasError = true;
  }

  if (hasError) {
    return;
  }

  var users = getSavedUsers();

  if (users[email]) {
    showError("signupEmail", "This email already has an account. Log in instead.");
    return;
  }

  var role = getSelectedRole("signupRole");

  users[email] = { name: name, password: password, role: role };
  saveEmailLocally(email, "signup");
  saveUsers(users);

  finishLogin({ name: name, email: email, role: role }, "Account created. Welcome to Stackly!");
}

function handleLogin(event) {
  event.preventDefault();

  var email = document.getElementById("loginEmail").value.trim().toLowerCase();
  var password = document.getElementById("loginPassword").value;
  var hasError = false;

  showError("loginEmail", "");
  showError("loginPassword", "");

  if (!isValidEmail(email)) {
    showError("loginEmail", "Enter a valid email address.");
    hasError = true;
  }

  if (password === "") {
    showError("loginPassword", "Enter your password.");
    hasError = true;
  }

  if (hasError) {
    return;
  }

  var users = getSavedUsers();
  var name = email.split("@")[0];
  name = name.charAt(0).toUpperCase() + name.slice(1);

  if (users[email]) {
    name = users[email].name;
  }

  saveEmailLocally(email, "login");
  finishLogin({ name: name, email: email, role: getSelectedRole("loginRole") }, "Logged in. Good to see you!");
}

function handleLogout() {
  currentUser = null;
  saveLogin(null);
  showMessage("You are logged out");

  if (location.hash === "#/" || location.hash === "") {
    showPage();
  } else {
    location.hash = "#/";
  }
}

function togglePassword(event) {
  var button = event.target;
  var input = document.getElementById(button.getAttribute("data-target"));

  if (input.type === "password") {
    input.type = "text";
    button.textContent = "Hide";
  } else {
    input.type = "password";
    button.textContent = "Show";
  }
}

function goBack() {
  if (history.length > 1) {
    history.back();
  } else {
    location.hash = "#/";
  }
}

function countUp(element) {
  var target = Number(element.getAttribute("data-to"));
  var suffix = element.getAttribute("data-suffix") || "";
  var decimals = Number(element.getAttribute("data-decimals") || 0);
  var steps = 50;
  var step = 0;

  var timer = setInterval(function () {
    step = step + 1;

    var value = target * (step / steps);

    if (step >= steps) {
      value = target;
      clearInterval(timer);
    }

    element.textContent = value.toFixed(decimals) + suffix;
  }, 30);
}

function startLogoLinks() {
  document.querySelectorAll(".logo, .panel-logo").forEach(function (logo) {
    logo.addEventListener("click", function (event) {
      var alreadyHome = location.hash === "" || location.hash === "#/";

      closeMenu();

      if (alreadyHome) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}


/* Keep opt-in/signup emails in this browser's localStorage for the demo.
   This is local-only storage, not a production mailing-list backend. */
function saveEmailLocally(email, source) {
  var normalized = String(email || "").trim().toLowerCase();
  if (!isValidEmail(normalized)) return false;
  var entries = [];
  try { entries = JSON.parse(localStorage.getItem("stackly_emails") || "[]"); } catch (error) {}
  if (!Array.isArray(entries)) entries = [];
  if (!entries.some(function (entry) { return entry.email === normalized; })) {
    entries.push({ email: normalized, source: source, savedAt: new Date().toISOString() });
    try { localStorage.setItem("stackly_emails", JSON.stringify(entries)); } catch (error) {}
  }
  return true;
}

var newsletterForm = document.getElementById("newsletterForm");
if (newsletterForm) {
  newsletterForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var field = document.getElementById("newsletterEmail");
    var status = document.getElementById("newsletterStatus");
    if (saveEmailLocally(field.value, "newsletter")) {
      status.textContent = "You're on the list! Your email was saved in this browser.";
      field.value = "";
      showMessage("Thanks for joining Stackly!");
    } else {
      status.textContent = "Please enter a valid email address.";
    }
  });
}

document.getElementById("signupForm").addEventListener("submit", handleSignup);
document.getElementById("loginForm").addEventListener("submit", handleLogin);
document.getElementById("logoutButton").addEventListener("click", handleLogout);
document.getElementById("adminLogout").addEventListener("click", handleLogout);
document.getElementById("userLogout").addEventListener("click", handleLogout);
document.getElementById("goBackButton").addEventListener("click", goBack);
document.getElementById("menuButton").addEventListener("click", toggleMenu);

document.querySelectorAll(".show-button").forEach(function (button) {
  button.addEventListener("click", togglePassword);
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeMenu();
  }
});

window.addEventListener("hashchange", changePage);

currentUser = getSavedLogin();
startLogoLinks();
showPage();
startLoader();

/* =====================================================================
   Creative upgrade: scroll reveals, split text, hero motion, nav blob
   ===================================================================== */

var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Wrap words (or letters) of [data-split] headings so they can animate in one by one. */
function splitText() {
  document.querySelectorAll("[data-split]").forEach(function (host) {
    var mode = host.getAttribute("data-split");
    var label = host.textContent.replace(/\s+/g, " ").trim();
    var n = 0;

    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();

          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (part === "") {
              return;
            }

            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }

            if (mode === "chars") {
              var group = document.createElement("span");
              group.className = "wd";

              Array.from(part).forEach(function (letter) {
                var ch = document.createElement("span");
                ch.className = "ch";
                ch.style.setProperty("--i", n++);
                ch.textContent = letter;
                group.appendChild(ch);
              });

              frag.appendChild(group);
            } else {
              var outer = document.createElement("span");
              var inner = document.createElement("span");
              outer.className = "w";
              inner.className = "wi";
              inner.style.setProperty("--i", n++);
              inner.textContent = part;
              outer.appendChild(inner);
              frag.appendChild(outer);
            }
          });

          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    }

    walk(host);
    host.setAttribute("aria-label", label);

    Array.prototype.forEach.call(host.children, function (kid) {
      kid.setAttribute("aria-hidden", "true");
    });
  });
}

/* selector, animation style. Everything here starts hidden and animates the first time it is scrolled to. */
var animMap = [
  [".brands-title", "up"],
  [".head > *", "up"],
  [".split-art", "left"],
  [".split-text > :not(.points)", "up"],
  [".points li", "right"],
  [".aisle", "zoom"],
  [".feature", "flip"],
  [".dash-card", "zoom"],
  [".chips li", "pop"],
  [".smart-text > :not(ul)", "up"],
  [".smart-points li", "right"],
  [".smart-art", "zoom"],
  [".step-row > img", "wipe"],
  [".step-row:not(.flip) > div", "right"],
  [".step-row.flip > div", "left"],
  [".stats-band h2", "blur"],
  [".stat-grid > div", "pop"],
  [".cta-box", "zoom"],
  [".dash > :not(.tiles):not(.panels)", "up"],
  [".tile", "pop"],
  [".panel", "up"],
  [".footer-join > *", "up"],
  [".footer-grid > div", "up"],
  [".footer-bottom", "blur"]
];

function startObservers() {
  var targets = new Map();   /* watched element -> elements it reveals */

  function watch(trigger, item) {
    if (!targets.has(trigger)) {
      targets.set(trigger, []);
    }

    targets.get(trigger).push(item);
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    animMap.forEach(function (rule) {
      var seen = new Map();

      document.querySelectorAll(rule[0]).forEach(function (el) {
        if (el.hasAttribute("data-anim")) {
          return;
        }

        var count = seen.get(el.parentNode) || 0;
        seen.set(el.parentNode, count + 1);

        el.setAttribute("data-anim", rule[1]);
        el.style.setProperty("--i", Math.min(count, 5));

        /* a clip-path wipe hides the element completely, and the browser counts a fully
           clipped element as off-screen, so wiped images are triggered by their parent row */
        watch(rule[1] === "wipe" ? el.parentNode : el, el);
      });
    });
  }

  document.querySelectorAll(".count").forEach(function (el) {
    watch(el, el);
  });

  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (items) {
      items.forEach(function (el) {
        if (el.classList.contains("count")) {
          countUp(el);
        }
      });
    });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) {
        return;
      }

      (targets.get(entry.target) || []).forEach(function (item) {
        var wait = 1400 + Number(item.style.getPropertyValue("--i") || 0) * 110;

        if (item.hasAttribute("data-anim")) {
          item.classList.add("in");

          /* once it has played, hand the element back to its normal styles (hover effects etc.) */
          setTimeout(function () {
            item.removeAttribute("data-anim");
            item.style.removeProperty("--i");
          }, wait);
        }

        if (item.classList.contains("count")) {
          countUp(item);
        }
      });

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  targets.forEach(function (items, trigger) {
    observer.observe(trigger);
  });
}

/* sliding highlight behind the nav links */
function startNavBlob() {
  var wrap = document.querySelector(".nav-links-wrap");
  var blob = document.getElementById("navBlob");
  var links = wrap.querySelectorAll("a");

  function place(link) {
    if (!link) {
      blob.style.opacity = "0";
      links.forEach(function (l) { l.classList.remove("hot"); });
      return;
    }

    var box = wrap.getBoundingClientRect();
    var rect = link.getBoundingClientRect();

    blob.style.opacity = "1";
    blob.style.width = rect.width + "px";
    blob.style.transform = "translateX(" + (rect.left - box.left) + "px)";

    links.forEach(function (l) {
      l.classList.toggle("hot", l === link);
    });
  }

  function settle() {
    place(wrap.querySelector("a.active"));
  }

  links.forEach(function (link) {
    link.addEventListener("mouseenter", function () { place(link); });
    link.addEventListener("focus", function () { place(link); });
  });

  wrap.addEventListener("mouseleave", settle);
  wrap.addEventListener("focusout", settle);
  window.addEventListener("resize", settle);
  window.addEventListener("load", settle);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(settle);
  }

  window.settleNav = settle;
  settle();
}

/* 3D tilt on cards that follow the pointer */
function startTilt() {
  if (reduceMotion || !window.matchMedia("(hover: hover)").matches) {
    return;
  }

  document.querySelectorAll(".aisle, .feature, .tile").forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      var rect = card.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.setProperty("--ry", (x * 10).toFixed(2) + "deg");
      card.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
    });

    card.addEventListener("pointerleave", function () {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}

/* hero: images drift with the pointer, a soft light follows it */
function startHeroMotion() {
  var hero = document.getElementById("hero");
  var glow = document.getElementById("heroGlow");
  var layers = hero.querySelectorAll("[data-depth]");

  if (reduceMotion || !window.matchMedia("(hover: hover)").matches) {
    return;
  }

  hero.addEventListener("pointermove", function (event) {
    var rect = hero.getBoundingClientRect();
    var nx = (event.clientX - rect.left) / rect.width - 0.5;
    var ny = (event.clientY - rect.top) / rect.height - 0.5;

    layers.forEach(function (layer) {
      var depth = Number(layer.getAttribute("data-depth"));
      layer.style.translate = (-nx * depth).toFixed(1) + "px " + (-ny * depth).toFixed(1) + "px";
    });

    glow.style.setProperty("--gx", (event.clientX - rect.left) + "px");
    glow.style.setProperty("--gy", (event.clientY - rect.top) + "px");
  });

  hero.addEventListener("pointerleave", function () {
    layers.forEach(function (layer) {
      layer.style.translate = "0px 0px";
    });
  });
}

/* one scroll handler: nav shrink + progress, back-to-top button, gentle image parallax */
function startScrollEffects() {
  var header = document.querySelector("header");
  var toTop = document.getElementById("toTop");
  var plx = document.querySelectorAll("[data-plx]");
  var waiting = false;

  function update() {
    waiting = false;

    var y = window.pageYOffset || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle("scrolled", y > 20);
    header.style.setProperty("--scroll", max > 0 ? (y / max).toFixed(4) : "0");
    toTop.classList.toggle("show", y > 700);

    if (reduceMotion) {
      return;
    }

    plx.forEach(function (el) {
      var rect = el.getBoundingClientRect();

      if (rect.bottom < -100 || rect.top > window.innerHeight + 100) {
        return;
      }

      var offset = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.translate = "0 " + (-offset * Number(el.getAttribute("data-plx"))).toFixed(1) + "px";
    });
  }

  window.addEventListener("scroll", function () {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  update();
}

splitText();
startObservers();
startNavBlob();
startTilt();
startHeroMotion();
startScrollEffects();


/* ---------- Login + sign up pages: eye toggle, demo accounts, motion ---------- */
document.querySelectorAll(".au-eye").forEach(function (button) {
  button.addEventListener("click", function () {
    var input = document.getElementById(button.getAttribute("data-target"));
    var show = input.type === "password";
    input.type = show ? "text" : "password";
    button.classList.toggle("on", show);
    button.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
});

var demoAccounts = {
  admin: { email: "admin@stackly.com", password: "stackly1" },
  user: { email: "user@stackly.com", password: "stackly1" }
};

document.querySelectorAll("[data-demo]").forEach(function (button) {
  button.addEventListener("click", function () {
    var kind = button.getAttribute("data-demo");
    document.getElementById("loginEmail").value = demoAccounts[kind].email;
    document.getElementById("loginPassword").value = demoAccounts[kind].password;
    document.querySelector('input[name="loginRole"][value="' + kind + '"]').checked = true;
    showError("loginEmail", "");
    showError("loginPassword", "");
    showMessage("Demo " + kind + " account filled in. Press Log in.");
  });
});

var forgotButton = document.getElementById("forgotButton");
if (forgotButton) {
  forgotButton.addEventListener("click", function () {
    location.hash = "#/404";
  });
}

/* Button ripple */
document.querySelectorAll(".au-btn").forEach(function (button) {
  button.addEventListener("pointerdown", function (event) {
    var box = button.getBoundingClientRect();
    var dot = document.createElement("span");
    dot.className = "rip";
    dot.style.left = event.clientX - box.left + "px";
    dot.style.top = event.clientY - box.top + "px";
    button.appendChild(dot);
    setTimeout(function () { dot.remove(); }, 700);
  });
});

/* Mouse parallax for the glows and floating chips */
(function () {
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia("(pointer: coarse)").matches;
  if (calm || touch) return;

  document.querySelectorAll(".au-page").forEach(function (page) {
    var waiting = false;
    page.addEventListener("pointermove", function (event) {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(function () {
        page.style.setProperty("--px", (event.clientX / window.innerWidth - 0.5).toFixed(3));
        page.style.setProperty("--py", (event.clientY / window.innerHeight - 0.5).toFixed(3));
        waiting = false;
      });
    });
  });
})();

/* ---- Dashboard menu views (user + admin) ---- */
(function () {
  var chip = function (t) {
    var c = { Delivered: "ok", Active: "ok", Approved: "ok", Shipped: "warn", Processing: "warn", Pending: "warn", Review: "warn", Flagged: "bad", Suspended: "bad", Cancelled: "bad" }[t] || "";
    return '<span class="ad-chip ' + c + '">' + t + "</span>";
  };
  var table = function (heads, rows) {
    return '<div class="ad-card"><div class="ad-tablewrap"><table class="ad-table"><thead><tr>' +
      heads.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody></table></div></div>";
  };
  var inbox = function (mails) {
    return '<div class="ad-card"><ul class="ad-inbox">' + mails.map(function (m, i) {
      return '<li data-act="read" class="' + (i > 1 ? "read" : "") + '"><i class="dot"></i><div><b>' + m[0] + "</b><span>" + m[1] + "</span></div><time>" + m[2] + "</time></li>";
    }).join("") + "</ul></div>";
  };
  var metrics = function (list) {
    return '<div class="ad-metrics">' + list.map(function (m) {
      return '<div class="ad-metric"><b>' + m[0] + "</b><span>" + m[1] + "</span><small>" + m[2] + "</small></div>";
    }).join("") + "</div>";
  };
  var bars = function (title) {
    var v = [38, 46, 42, 55, 60, 52, 66, 72, 68, 80, 76, 90], m = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
    return '<div class="ad-card"><h3>' + title + '</h3><div class="ad-bars">' + v.map(function (x, i) {
      return '<span style="--h:' + x + '%"><em>' + m[i] + "</em></span>";
    }).join("") + "</div></div>";
  };
  var prog = function (rows) {
    return rows.map(function (r) { return '<div class="ad-prog"><div><span>' + r[0] + "</span><b>" + r[1] + '%</b></div><i style="--w:' + r[1] + '%"></i></div>'; }).join("");
  };
  var settings = function (fields, checks) {
    return '<div class="ad-card"><h3>Profile and preferences</h3><div class="ad-form">' + fields.map(function (f) {
      return "<label>" + f[0] + '<input type="' + (f[2] || "text") + '" value="' + f[1] + '"></label>';
    }).join("") + checks.map(function (c) {
      return '<label class="chk full"><input type="checkbox" checked>' + c + "</label>";
    }).join("") + '<div class="full"><button type="button" class="ad-sbtn" data-act="save">Save changes</button></div></div></div>';
  };
  var wish = function (items) {
    return '<div class="ad-grid">' + items.map(function (w) {
      return '<div class="ad-card ad-item"><div class="ad-thumb">' + w[0].charAt(0) + "</div><b>" + w[0] + "</b><small>" + w[1] + '</small><div class="price">' + w[2] + '</div><div class="ad-actions"><button type="button" class="ad-sbtn" data-act="cart">Add to cart</button><button type="button" class="ad-sbtn alt" data-act="remove">Remove</button></div></div>';
    }).join("") + "</div>";
  };

  var VIEWS = {
    dashboard: {
      "inbox": ["Inbox", "Messages from farms, deals and support.", function () { return inbox([["Green Valley Farm", "Your order has shipped", "10:24 AM"], ["Stackly Deals", "Price drop on your wishlist", "9:05 AM"], ["Stackly Wallet", "Cashback added to your wallet", "Yesterday"], ["Lakshmi Devi", "Thanks for your review of the wheat", "Mon"], ["Stackly Support", "Your ticket has been resolved", "Sun"]]); }],
      "my-orders": ["My orders", "Track everything you have bought.", function () { return table(["Order", "Item", "Farm", "Date", "Amount", "Status"], [["#ST-1042", "Organic wheat, 5 kg", "Green Valley Farm", "12 Oct", "$18.50", chip("Shipped")], ["#ST-1039", "Cold-pressed honey", "Hill Honey Co.", "08 Oct", "$12.00", chip("Processing")], ["#ST-1033", "Mixed spices pack", "Spice Route", "02 Oct", "$24.90", chip("Delivered")], ["#ST-1027", "Fresh greens box", "Leaf and Root", "27 Sep", "$9.75", chip("Delivered")], ["#ST-1019", "Basmati rice, 10 kg", "Sunrise Fields", "18 Sep", "$32.00", chip("Cancelled")]]); }],
      "wishlist": ["Wishlist", "Products you are keeping an eye on.", function () { return wish([["Organic Jaggery", "Green Valley Farm", "$6.40"], ["Farm Fresh Eggs", "Sunrise Fields", "$4.20"], ["Raw Forest Honey", "Hill Honey Co.", "$14.00"], ["Red Chilli Powder", "Spice Route", "$5.10"], ["Millet Mix, 2 kg", "Green Valley Farm", "$8.80"], ["Cold-pressed Oil", "Leaf and Root", "$11.30"]]); }],
      "wallet": ["Wallet", "Your balance, cashback and recent activity.", function () { return metrics([["$142", "Balance", "Available to spend"], ["$18.40", "Cashback", "Ready to use"], ["320", "Reward points", "Worth $3.20"], ["$56", "Spent this month", "Across 4 orders"]]) + '<h2 class="ad-h2">Recent transactions</h2>' + table(["Date", "Description", "Type", "Amount"], [["14 Oct", "Cashback on order #ST-1033", chip("Approved"), "+$2.49"], ["12 Oct", "Order #ST-1042", chip("Shipped"), "-$18.50"], ["08 Oct", "Wallet top-up", chip("Approved"), "+$50.00"], ["02 Oct", "Order #ST-1033", chip("Delivered"), "-$24.90"]]); }],
      "settings": ["Settings", "Manage your account details and notifications.", function () { return settings([["Full name", "User"], ["Email", "user@stackly.com", "email"], ["Phone", "+91 90000 00000"], ["City", "Siddipet"]], ["Email me about order updates", "Send me price-drop alerts for my wishlist"]); }]
    },
    admin: {
      "inbox": ["Inbox", "Messages from sellers and buyers.", function () { return inbox([["Lakshmi Devi", "Payout for last week's wheat order", "10:12 AM"], ["Ramesh Reddy", "Listing flagged for review", "9:40 AM"], ["Anjali Sharma", "Question about escrow release", "Yesterday"], ["Stackly Support", "Weekly summary is ready", "Mon"]]); }],
      "users": ["Users", "Buyers and sellers on the marketplace.", function () { return table(["Name", "Email", "Role", "Joined", "Status"], [["Lakshmi Devi", "lakshmi@mail.com", "Seller", "Jan 2026", chip("Active")], ["Ramesh Reddy", "ramesh@mail.com", "Seller", "Mar 2026", chip("Review")], ["Anjali Sharma", "anjali@mail.com", "Buyer", "Apr 2026", chip("Active")], ["Kiran Rao", "kiran@mail.com", "Buyer", "Jun 2026", chip("Active")], ["Meena Joshi", "meena@mail.com", "Seller", "Aug 2026", chip("Suspended")]]); }],
      "analytics": ["Analytics", "How the marketplace is performing.", function () { return metrics([["48.2k", "Visits", "+9.4% this week"], ["3.8%", "Conversion", "+0.3% this week"], ["$62", "Avg. order", "+$2 this week"], ["71%", "Returning buyers", "+1.2% this week"]]) + '<h2 class="ad-h2">Trends</h2><div class="ad-cols">' + bars("Sales, last 12 months") + '<div class="ad-card"><h3>Top categories</h3>' + prog([["Grains", 82], ["Spices", 64], ["Fresh produce", 55], ["Honey and dairy", 38]]) + "</div></div>"; }],
      "listings": ["Listings", "Review and approve seller listings.", function () { return table(["Listing", "Seller", "Price", "Status", "Action"], [["Organic wheat, 25 kg", "Lakshmi Devi", "$38.00", chip("Approved"), ""], ["Forest honey, 1 kg", "Ramesh Reddy", "$14.00", chip("Flagged"), '<button type="button" class="ad-sbtn" data-act="approve">Approve</button>'], ["Mixed spices pack", "Meena Joshi", "$24.90", chip("Pending"), '<button type="button" class="ad-sbtn" data-act="approve">Approve</button>'], ["Basmati rice, 10 kg", "Lakshmi Devi", "$32.00", chip("Approved"), ""], ["Fresh greens box", "Kiran Rao", "$9.75", chip("Pending"), '<button type="button" class="ad-sbtn" data-act="approve">Approve</button>']]); }],
      "settings": ["Settings", "Marketplace configuration.", function () { return settings([["Marketplace name", "Stackly"], ["Support email", "support@stackly.com", "email"], ["Commission (%)", "5", "number"], ["Payout schedule", "Weekly"]], ["Require approval for new listings", "Email me when a listing is flagged"]); }]
    }
  };

  ["dashboard", "admin"].forEach(function (id) {
    var section = document.getElementById(id), main = section.querySelector(".ad-main"), top = main.querySelector(".ad-top");
    var home = document.createElement("div");
    home.className = "ad-view on";
    while (top.nextSibling) { home.appendChild(top.nextSibling); }
    main.appendChild(home);
    var views = { overview: home };

    var go = function (key) {
      Object.keys(views).forEach(function (k) { views[k].classList.toggle("on", k === key); });
      section.querySelectorAll(".ad-nav a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-view") === key); });
      window.scrollTo(0, 0);
    };

    Object.keys(VIEWS[id]).forEach(function (key) {
      var v = VIEWS[id][key], el = document.createElement("div");
      el.className = "ad-view";
      el.innerHTML = '<p class="ad-eyebrow">' + v[0] + '</p><div class="ad-hero"><div><h1>' + v[0] + "</h1><p>" + v[1] + '</p></div></div><div class="ad-body" style="margin-top:24px">' + v[2]() + "</div>";
      main.appendChild(el);
      views[key] = el;
    });

    section.querySelectorAll(".ad-nav a").forEach(function (a) {
      var label = a.querySelector("span").textContent.trim().toLowerCase().replace(/\s+/g, "-");
      a.setAttribute("data-view", label === "overview" ? "overview" : label);
      a.setAttribute("href", "#/" + id);
    });

    section.addEventListener("click", function (e) {
      var nav = e.target.closest(".ad-nav a, .ad-open, .ad-card h3 a");
      if (nav) {
        e.preventDefault();
        go(nav.getAttribute("data-view") || "inbox");
        return;
      }
      var b = e.target.closest("[data-act]");
      if (!b) { return; }
      var act = b.getAttribute("data-act");
      if (act === "read") { b.classList.toggle("read"); }
      if (act === "save") { showMessage("Settings saved"); }
      if (act === "cart") { showMessage("Added to cart"); }
      if (act === "remove") { b.closest(".ad-card").remove(); showMessage("Removed from wishlist"); }
      if (act === "approve") {
        var row = b.closest("tr");
        row.querySelector(".ad-chip").outerHTML = chip("Approved");
        b.remove();
        showMessage("Listing approved");
      }
    });

    window.addEventListener("hashchange", function () { go("overview"); });
  });
})();
