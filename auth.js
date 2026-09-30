// Authentication & Session Management Module
const Auth = {
  currentUser: null,

  init() {
    this.currentUser = StorageManager.get("current_user", INITIAL_DATA.users[0]);
    this.renderHeaderUser();
    this.bindEvents();
  },

  getCurrentUser() {
    return this.currentUser;
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  isAdmin() {
    return this.currentUser && this.currentUser.role === "admin";
  },

  isDriver() {
    return this.currentUser && this.currentUser.role === "driver";
  },

  isCitizen() {
    return this.currentUser && this.currentUser.role === "citizen";
  },

  renderHeaderUser() {
    const userContainer = document.getElementById("header-user-section");
    if (!userContainer) return;

    if (this.currentUser) {
      const roleBadgeClass = this.currentUser.role === "admin" 
        ? "bg-purple-100 text-purple-700 border-purple-200" 
        : this.currentUser.role === "driver" 
        ? "bg-amber-100 text-amber-700 border-amber-200" 
        : "bg-emerald-100 text-emerald-700 border-emerald-200";

      const roleLabel = this.currentUser.role === "admin" ? "Municipal Admin" 
        : this.currentUser.role === "driver" ? "Field Driver" : "Citizen";

      userContainer.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="hidden md:flex flex-col text-right">
            <span class="text-sm font-bold text-slate-800">${this.currentUser.name}</span>
            <div class="flex items-center gap-1.5 justify-end">
              <span class="text-xs px-2 py-0.5 rounded-full border font-semibold ${roleBadgeClass}">${roleLabel}</span>
              ${this.currentUser.role === 'citizen' ? `
                <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  🌱 ${this.currentUser.ecoPoints || 100} pts
                </span>` : ''}
            </div>
          </div>
          <button id="profile-dropdown-btn" class="flex items-center gap-2 p-1 rounded-full border border-slate-200 hover:border-emerald-500 transition-all focus:outline-none" title="Profile & Roles">
            <img src="${this.currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" 
                 alt="${this.currentUser.name}" 
                 class="w-9 h-9 rounded-full object-cover">
          </button>
        </div>
      `;

      // Quick Role Switcher bar update
      this.updateRoleBar();
    } else {
      userContainer.innerHTML = `
        <div class="flex items-center gap-2">
          <button id="nav-login-btn" class="btn btn-secondary text-sm py-1.5 px-3">Log In</button>
          <button id="nav-register-btn" class="btn btn-primary text-sm py-1.5 px-3.5">Sign Up</button>
        </div>
      `;
    }
  },

  updateRoleBar() {
    const roleBar = document.getElementById("active-role-notice");
    if (!roleBar) return;
    if (this.currentUser.role === "admin") {
      roleBar.className = "bg-purple-900 text-purple-100 text-xs py-1.5 px-4 flex items-center justify-between";
      roleBar.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span><strong>Admin Mode Active:</strong> Logged in as ${this.currentUser.name} (${this.currentUser.designation || 'Municipal Inspector'})</span>
        </div>
        <button onclick="Auth.quickSwitchRole('citizen')" class="text-purple-200 underline hover:text-white font-medium">Switch to Citizen View</button>
      `;
      roleBar.classList.remove("hidden");
    } else if (this.currentUser.role === "driver") {
      roleBar.className = "bg-amber-900 text-amber-100 text-xs py-1.5 px-4 flex items-center justify-between";
      roleBar.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span><strong>Field Agent Mode:</strong> Logged in as ${this.currentUser.name} (${this.currentUser.vehicle || 'Vehicle Driver'})</span>
        </div>
        <button onclick="Auth.quickSwitchRole('admin')" class="text-amber-200 underline hover:text-white font-medium">Switch to Admin View</button>
      `;
      roleBar.classList.remove("hidden");
    } else {
      roleBar.classList.add("hidden");
    }
  },

  quickSwitchRole(role) {
    const users = StorageManager.get("users", INITIAL_DATA.users);
    let target = users.find(u => u.role === role);
    if (!target) {
      if (role === "admin") target = INITIAL_DATA.users[1];
      else if (role === "driver") target = INITIAL_DATA.users[2];
      else target = INITIAL_DATA.users[0];
    }
    this.currentUser = target;
    StorageManager.set("current_user", target);
    this.renderHeaderUser();
    App.showToast(`Switched account to ${target.name} (${target.role.toUpperCase()})`);
    
    // Switch default tab based on role
    if (role === "admin" || role === "driver") {
      App.switchTab("admin-dashboard");
    } else {
      App.switchTab("report-issue");
    }
  },

  bindEvents() {
    document.addEventListener("click", (e) => {
      // Profile dropdown
      if (e.target.closest("#profile-dropdown-btn")) {
        this.openProfileModal();
      }
      if (e.target.closest("#nav-login-btn") || e.target.closest("#quick-login-trigger")) {
        this.openLoginModal();
      }
      if (e.target.closest("#nav-register-btn") || e.target.closest("#quick-register-trigger")) {
        this.openRegisterModal();
      }
    });

    // Handle Registration Form Submit
    const regForm = document.getElementById("register-form");
    if (regForm) {
      regForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleRegister(new FormData(regForm));
      });
    }

    // Handle Login Form Submit
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin(new FormData(loginForm));
      });
    }
  },

  handleRegister(formData) {
    const name = formData.get("name")?.trim();
    const email = formData.get("email")?.trim().toLowerCase();
    const phone = formData.get("phone")?.trim();
    const ward = formData.get("ward");
    const address = formData.get("address")?.trim();
    const role = formData.get("role") || "citizen";

    if (!name || !email || !phone) {
      App.showToast("Please fill in all mandatory fields", "error");
      return;
    }

    const users = StorageManager.get("users", INITIAL_DATA.users);
    const existing = users.find(u => u.email === email);
    if (existing) {
      App.showToast("An account with this email already exists", "error");
      return;
    }

    const newUser = {
      id: "usr_" + Date.now(),
      name,
      email,
      phone,
      ward: ward || "Ward 4 - Green Valley",
      address: address || "City Center",
      role,
      ecoPoints: 50, // Welcome bonus
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    };

    users.push(newUser);
    StorageManager.set("users", users);
    this.currentUser = newUser;
    StorageManager.set("current_user", newUser);

    App.closeModal("auth-modal");
    this.renderHeaderUser();
    App.showToast(`Welcome ${name}! +50 Eco-Points added.`);
    
    if (role === "admin") App.switchTab("admin-dashboard");
    else App.switchTab("report-issue");
  },

  handleLogin(formData) {
    const email = formData.get("email")?.trim().toLowerCase();
    const role = formData.get("loginRole") || "citizen";

    const users = StorageManager.get("users", INITIAL_DATA.users);
    let matched = users.find(u => u.email === email);

    // If not found by email, allow logging in as the demo role user
    if (!matched) {
      matched = users.find(u => u.role === role) || INITIAL_DATA.users[0];
    }

    this.currentUser = matched;
    StorageManager.set("current_user", matched);

    App.closeModal("auth-modal");
    this.renderHeaderUser();
    App.showToast(`Logged in successfully as ${matched.name}`);

    if (matched.role === "admin" || matched.role === "driver") {
      App.switchTab("admin-dashboard");
    } else {
      App.switchTab("complaint-tracking");
    }
  },

  addEcoPoints(points) {
    if (!this.currentUser) return;
    this.currentUser.ecoPoints = (this.currentUser.ecoPoints || 0) + points;
    StorageManager.set("current_user", this.currentUser);
    
    // Update in users list
    const users = StorageManager.get("users", INITIAL_DATA.users);
    const idx = users.findIndex(u => u.id === this.currentUser.id);
    if (idx !== -1) {
      users[idx] = this.currentUser;
      StorageManager.set("users", users);
    }
    this.renderHeaderUser();
    App.showToast(`🎉 Earned +${points} Eco-Points for civic participation!`);
  },

  openProfileModal() {
    const modalContent = document.getElementById("profile-modal-body");
    if (!modalContent || !this.currentUser) return;

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center gap-4 mb-6 pb-4 border-b">
          <img src="${this.currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" 
               class="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow">
          <div>
            <h3 class="text-xl font-bold text-slate-800">${this.currentUser.name}</h3>
            <p class="text-xs text-slate-500">${this.currentUser.email} • ${this.currentUser.phone}</p>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                ${this.currentUser.role.toUpperCase()}
              </span>
              <span class="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                ${this.currentUser.ward || 'Central Zone'}
              </span>
            </div>
          </div>
        </div>

        <!-- Eco Score & Stats -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
            <span class="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Eco-Points Balance</span>
            <div class="text-3xl font-extrabold text-emerald-800 mt-1">🌱 ${this.currentUser.ecoPoints || 120}</div>
            <p class="text-[11px] text-emerald-600 mt-1">Tier: Green Guardian (Level 3)</p>
          </div>
          <div class="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
            <span class="text-xs text-blue-700 font-semibold uppercase tracking-wider">Reports Logged</span>
            <div class="text-3xl font-extrabold text-blue-800 mt-1">📋 ${this.getUserReportCount()}</div>
            <p class="text-[11px] text-blue-600 mt-1">Active contributor in Ward</p>
          </div>
        </div>

        <!-- Demo Role Switcher Quick Actions -->
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Switch Demo Profiles & Roles</h4>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="Auth.quickSwitchRole('citizen'); App.closeModal('profile-modal');" 
                    class="py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 text-center transition">
              👤 Citizen<br><span class="text-[10px] text-slate-400">Anveshi Sharma</span>
            </button>
            <button onclick="Auth.quickSwitchRole('admin'); App.closeModal('profile-modal');" 
                    class="py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-purple-500 hover:bg-purple-50 text-slate-700 text-center transition">
              🛡️ Municipal Admin<br><span class="text-[10px] text-slate-400">Officer Verma</span>
            </button>
            <button onclick="Auth.quickSwitchRole('driver'); App.closeModal('profile-modal');" 
                    class="py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-amber-500 hover:bg-amber-50 text-slate-700 text-center transition">
              🚚 Field Driver<br><span class="text-[10px] text-slate-400">Ramesh Kumar</span>
            </button>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2">
          <button onclick="Auth.logout()" class="text-sm font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1.5">
            Log Out
          </button>
          <button onclick="App.closeModal('profile-modal')" class="btn btn-secondary text-sm">Close</button>
        </div>
      </div>
    `;
    App.openModal("profile-modal");
  },

  getUserReportCount() {
    const complaints = StorageManager.get("complaints", INITIAL_DATA.complaints);
    return complaints.filter(c => c.reportedBy?.id === this.currentUser?.id).length;
  },

  openLoginModal() {
    const loginTab = document.getElementById("tab-login-btn");
    if (loginTab) loginTab.click();
    App.openModal("auth-modal");
  },

  openRegisterModal() {
    const regTab = document.getElementById("tab-register-btn");
    if (regTab) regTab.click();
    App.openModal("auth-modal");
  },

  logout() {
    this.currentUser = null;
    StorageManager.set("current_user", null);
    App.closeModal("profile-modal");
    this.renderHeaderUser();
    App.showToast("You have been logged out");
    App.switchTab("report-issue");
  }
};
