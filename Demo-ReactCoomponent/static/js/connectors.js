/**
 * Andexa Data Source Connectors Module
 * Handles connection configuration for SQL, Google Drive, S3, and REST API sources
 *
 * @version 1.0.0
 * @author Andexa Team
 */

(function() {
  'use strict';

  // ============================================================================
  // Configuration & Constants
  // ============================================================================

  const DB_TYPES = {
    mysql: { name: 'MySQL', defaultPort: 3306 },
    postgresql: { name: 'PostgreSQL', defaultPort: 5432 },
    sqlite: { name: 'SQLite', defaultPort: null },
    sqlserver: { name: 'SQL Server', defaultPort: 1433 },
    oracle: { name: 'Oracle', defaultPort: 1521 }
  };

  const AWS_REGIONS = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
    { value: 'eu-west-2', label: 'Europe (London)' },
    { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
    { value: 'sa-east-1', label: 'South America (Sao Paulo)' },
    { value: 'me-south-1', label: 'Middle East (Bahrain)' }
  ];

  const AUTH_TYPES = {
    none: { name: 'No Authentication', fields: [] },
    apikey: { name: 'API Key', fields: ['apiKeyHeader', 'apiKeyValue'] },
    bearer: { name: 'Bearer Token', fields: ['bearerToken'] },
    basic: { name: 'Basic Auth', fields: ['basicUsername', 'basicPassword'] },
    oauth2: { name: 'OAuth 2.0', fields: ['oauth2ClientId', 'oauth2ClientSecret', 'oauth2TokenUrl'] }
  };

  // ============================================================================
  // State Management
  // ============================================================================

  const state = {
    activeModal: null,
    connections: [],
    testingConnection: false,
    formData: {},
    apiHeaders: [{ key: '', value: '' }]
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  function generateId() {
    return 'conn_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function showNotification(title, message, variant = 'info') {
    // Use existing notification system if available
    if (typeof window.showNotification === 'function') {
      window.showNotification(title, message, variant);
      return;
    }

    // Fallback notification
    const container = document.getElementById('notification-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `notification-toast`;
    toast.setAttribute('data-variant', variant);
    toast.innerHTML = `
      <div class="notification-icon">
        <span class="material-symbols-outlined">
          ${variant === 'success' ? 'check_circle' : variant === 'error' ? 'error' : 'info'}
        </span>
      </div>
      <div class="notification-body">
        <div class="notification-title">${escapeHtml(title)}</div>
        <div class="notification-message">${escapeHtml(message)}</div>
      </div>
      <button class="notification-dismiss" onclick="this.parentElement.remove()">
        <span class="material-symbols-outlined">close</span>
      </button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('notification-hide'), 4000);
    setTimeout(() => toast.remove(), 4300);
  }

  // ============================================================================
  // Modal Management
  // ============================================================================

  function createModalOverlay(id, content) {
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'connector-modal-overlay hidden';
    overlay.innerHTML = content;
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(id);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
        closeModal(id);
      }
    });

    return overlay;
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('hidden');
      state.activeModal = id;

      // Focus first input
      const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }

      // Trap focus
      trapFocus(modal);
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('hidden');
      state.activeModal = null;
      resetFormState();
    }
  }

  function trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    });
  }

  function resetFormState() {
    state.testingConnection = false;
    state.formData = {};
    state.apiHeaders = [{ key: '', value: '' }];
  }

  // ============================================================================
  // SQL Database Modal
  // ============================================================================

  function createSQLModal() {
    const content = `
      <div class="connector-modal-container">
        <div class="connector-modal-header">
          <div class="connector-modal-icon">
            <span class="material-symbols-outlined">database</span>
          </div>
          <div class="connector-modal-title-group">
            <h2 class="connector-modal-title">Connect SQL Database</h2>
            <p class="connector-modal-subtitle">Configure your database connection settings</p>
          </div>
          <button class="connector-modal-close" onclick="AndexaConnectors.closeSQL()" aria-label="Close modal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="connector-modal-body">
          <form id="sql-connection-form" onsubmit="event.preventDefault();">
            <div class="connector-form-group">
              <label class="connector-label" for="sql-db-type">
                Database Type <span class="connector-label-required">*</span>
              </label>
              <select id="sql-db-type" class="connector-select" required onchange="AndexaConnectors.onDBTypeChange(this.value)">
                <option value="">Select database type</option>
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="sqlite">SQLite</option>
                <option value="sqlserver">SQL Server</option>
                <option value="oracle">Oracle</option>
              </select>
            </div>

            <div id="sql-connection-fields" class="hidden">
              <div class="connector-form-row">
                <div class="connector-form-group">
                  <label class="connector-label" for="sql-host">
                    Host / Server <span class="connector-label-required">*</span>
                  </label>
                  <input type="text" id="sql-host" class="connector-input" placeholder="localhost or IP address" required>
                </div>
                <div class="connector-form-group">
                  <label class="connector-label" for="sql-port">
                    Port <span class="connector-label-required">*</span>
                  </label>
                  <input type="number" id="sql-port" class="connector-input" placeholder="3306" required>
                </div>
              </div>

              <div class="connector-form-group">
                <label class="connector-label" for="sql-database">
                  Database Name <span class="connector-label-required">*</span>
                </label>
                <input type="text" id="sql-database" class="connector-input" placeholder="my_database" required>
              </div>

              <div class="connector-section-divider">Authentication</div>

              <div class="connector-form-row">
                <div class="connector-form-group">
                  <label class="connector-label" for="sql-username">
                    Username <span class="connector-label-required">*</span>
                  </label>
                  <input type="text" id="sql-username" class="connector-input" placeholder="root" required autocomplete="username">
                </div>
                <div class="connector-form-group">
                  <label class="connector-label" for="sql-password">
                    Password <span class="connector-label-required">*</span>
                  </label>
                  <div class="connector-password-wrapper">
                    <input type="password" id="sql-password" class="connector-input" placeholder="Enter password" required autocomplete="current-password">
                    <button type="button" class="connector-password-toggle" onclick="AndexaConnectors.togglePassword('sql-password', this)" aria-label="Toggle password visibility">
                      <span class="material-symbols-outlined">visibility</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="connector-form-group">
                <label class="connector-toggle">
                  <input type="checkbox" id="sql-ssl" class="connector-toggle-input">
                  <span class="connector-toggle-track"></span>
                  <span class="connector-toggle-label">Enable SSL/TLS encryption</span>
                </label>
                <p class="connector-helper-text">
                  <span class="material-symbols-outlined" style="font-size: 14px;">info</span>
                  Recommended for production databases
                </p>
              </div>

              <div class="connector-form-group">
                <label class="connector-label" for="sql-connection-name">
                  Connection Name
                </label>
                <input type="text" id="sql-connection-name" class="connector-input" placeholder="My Production Database">
                <p class="connector-helper-text">Optional friendly name for this connection</p>
              </div>
            </div>

            <div id="sql-sqlite-fields" class="hidden">
              <div class="connector-form-group">
                <label class="connector-label" for="sql-sqlite-path">
                  Database File Path <span class="connector-label-required">*</span>
                </label>
                <input type="text" id="sql-sqlite-path" class="connector-input" placeholder="/path/to/database.db" required>
                <p class="connector-helper-text">Enter the full path to your SQLite database file</p>
              </div>

              <div class="connector-form-group">
                <label class="connector-label" for="sql-sqlite-name">
                  Connection Name
                </label>
                <input type="text" id="sql-sqlite-name" class="connector-input" placeholder="My SQLite Database">
              </div>
            </div>
          </form>
        </div>

        <div class="connector-modal-footer">
          <div class="connector-footer-left">
            <div id="sql-status" class="connector-status connector-status-idle">
              <span class="connector-status-dot"></span>
              <span>Ready to connect</span>
            </div>
          </div>
          <div class="connector-footer-right">
            <button type="button" class="connector-btn connector-btn-secondary" onclick="AndexaConnectors.testSQL()">
              <span class="material-symbols-outlined">cable</span>
              Test Connection
            </button>
            <button type="button" class="connector-btn connector-btn-primary" onclick="AndexaConnectors.saveSQL()">
              <span class="material-symbols-outlined">save</span>
              Save Connection
            </button>
          </div>
        </div>
      </div>
    `;

    return createModalOverlay('sql-connector-modal', content);
  }

  function onDBTypeChange(type) {
    const connectionFields = document.getElementById('sql-connection-fields');
    const sqliteFields = document.getElementById('sql-sqlite-fields');
    const portInput = document.getElementById('sql-port');

    if (!type) {
      connectionFields.classList.add('hidden');
      sqliteFields.classList.add('hidden');
      return;
    }

    if (type === 'sqlite') {
      connectionFields.classList.add('hidden');
      sqliteFields.classList.remove('hidden');
    } else {
      connectionFields.classList.remove('hidden');
      sqliteFields.classList.add('hidden');

      // Set default port
      const dbConfig = DB_TYPES[type];
      if (dbConfig && dbConfig.defaultPort) {
        portInput.value = dbConfig.defaultPort;
      }
    }
  }

  async function testSQLConnection() {
    const form = document.getElementById('sql-connection-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const statusEl = document.getElementById('sql-status');
    updateConnectionStatus(statusEl, 'testing', 'Testing connection...');

    // Simulate connection test (replace with actual API call)
    await simulateDelay(2000);

    // Mock success/failure
    const success = Math.random() > 0.3;
    if (success) {
      updateConnectionStatus(statusEl, 'success', 'Connection successful');
      showNotification('Connection Test', 'Successfully connected to the database', 'success');
    } else {
      updateConnectionStatus(statusEl, 'error', 'Connection failed');
      showNotification('Connection Test', 'Failed to connect. Check your credentials.', 'error');
    }
  }

  async function saveSQLConnection() {
    const form = document.getElementById('sql-connection-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const dbType = document.getElementById('sql-db-type').value;
    let connectionData;

    if (dbType === 'sqlite') {
      connectionData = {
        id: generateId(),
        type: 'sql',
        subtype: 'sqlite',
        name: document.getElementById('sql-sqlite-name').value || 'SQLite Database',
        path: document.getElementById('sql-sqlite-path').value,
        createdAt: new Date().toISOString()
      };
    } else {
      connectionData = {
        id: generateId(),
        type: 'sql',
        subtype: dbType,
        name: document.getElementById('sql-connection-name').value || `${DB_TYPES[dbType].name} Connection`,
        host: document.getElementById('sql-host').value,
        port: parseInt(document.getElementById('sql-port').value, 10),
        database: document.getElementById('sql-database').value,
        username: document.getElementById('sql-username').value,
        ssl: document.getElementById('sql-ssl').checked,
        createdAt: new Date().toISOString()
      };
    }

    state.connections.push(connectionData);
    saveConnectionsToStorage();

    showNotification('Connection Saved', `${connectionData.name} has been added`, 'success');
    closeModal('sql-connector-modal');

    // Trigger refresh event
    document.dispatchEvent(new CustomEvent('andexaConnectionAdded', { detail: connectionData }));
  }

  // ============================================================================
  // Google Drive Modal
  // ============================================================================

  function createGoogleDriveModal() {
    const content = `
      <div class="connector-modal-container">
        <div class="connector-modal-header">
          <div class="connector-modal-icon" style="background: linear-gradient(135deg, rgba(52, 168, 83, 0.12) 0%, rgba(30, 142, 62, 0.12) 100%); color: #34a853;">
            <span class="material-symbols-outlined">cloud</span>
          </div>
          <div class="connector-modal-title-group">
            <h2 class="connector-modal-title">Connect Google Drive</h2>
            <p class="connector-modal-subtitle">Import data directly from your Google Drive</p>
          </div>
          <button class="connector-modal-close" onclick="AndexaConnectors.closeGoogleDrive()" aria-label="Close modal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="connector-modal-body">
          <div id="google-drive-disconnected">
            <button type="button" class="connector-btn connector-btn-oauth" onclick="AndexaConnectors.connectGoogle()">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect with Google
            </button>

            <p class="connector-helper-text" style="margin-top: 1rem; text-align: center;">
              <span class="material-symbols-outlined" style="font-size: 14px;">lock</span>
              Andexa will only access files you explicitly select
            </p>
          </div>

          <div id="google-drive-connected" class="hidden">
            <div class="connector-oauth-status">
              <div class="connector-oauth-avatar">
                <span class="material-symbols-outlined" style="font-size: 24px; color: #34a853;">account_circle</span>
              </div>
              <div class="connector-oauth-info">
                <div class="connector-oauth-name" id="google-user-name">John Doe</div>
                <div class="connector-oauth-email" id="google-user-email">john.doe@gmail.com</div>
              </div>
              <button type="button" class="connector-oauth-disconnect" onclick="AndexaConnectors.disconnectGoogle()">
                Disconnect
              </button>
            </div>

            <div class="connector-section-divider">Settings</div>

            <div class="connector-form-group">
              <label class="connector-label">Allowed File Types</label>
              <div class="connector-chip-group" id="google-file-types">
                <button type="button" class="connector-chip active" data-value="csv" onclick="AndexaConnectors.toggleChip(this)">
                  <span class="material-symbols-outlined">table_chart</span>
                  CSV
                </button>
                <button type="button" class="connector-chip active" data-value="xlsx" onclick="AndexaConnectors.toggleChip(this)">
                  <span class="material-symbols-outlined">table</span>
                  Excel
                </button>
                <button type="button" class="connector-chip" data-value="json" onclick="AndexaConnectors.toggleChip(this)">
                  <span class="material-symbols-outlined">data_object</span>
                  JSON
                </button>
                <button type="button" class="connector-chip" data-value="sheets" onclick="AndexaConnectors.toggleChip(this)">
                  <span class="material-symbols-outlined">grid_on</span>
                  Sheets
                </button>
              </div>
            </div>

            <div class="connector-form-group">
              <label class="connector-label" for="google-folder-path">
                Default Folder Path
              </label>
              <div style="display: flex; gap: 0.75rem;">
                <input type="text" id="google-folder-path" class="connector-input" placeholder="/" readonly style="flex: 1;">
                <button type="button" class="connector-btn connector-btn-secondary" onclick="AndexaConnectors.browseGoogleFolder()">
                  <span class="material-symbols-outlined">folder_open</span>
                  Browse
                </button>
              </div>
            </div>

            <div class="connector-form-group">
              <label class="connector-label" for="google-sync-frequency">
                Sync Frequency
              </label>
              <select id="google-sync-frequency" class="connector-select">
                <option value="manual">Manual only</option>
                <option value="hourly">Every hour</option>
                <option value="daily" selected>Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        </div>

        <div class="connector-modal-footer">
          <div class="connector-footer-left">
            <div id="google-status" class="connector-status connector-status-idle">
              <span class="connector-status-dot"></span>
              <span>Not connected</span>
            </div>
          </div>
          <div class="connector-footer-right">
            <button type="button" class="connector-btn connector-btn-secondary" onclick="AndexaConnectors.closeGoogleDrive()">
              Cancel
            </button>
            <button type="button" class="connector-btn connector-btn-primary" onclick="AndexaConnectors.saveGoogleDrive()" id="google-save-btn" disabled>
              <span class="material-symbols-outlined">save</span>
              Save Connection
            </button>
          </div>
        </div>
      </div>
    `;

    return createModalOverlay('google-drive-connector-modal', content);
  }

  async function connectGoogle() {
    const statusEl = document.getElementById('google-status');
    updateConnectionStatus(statusEl, 'testing', 'Connecting to Google...');

    // Simulate OAuth flow
    await simulateDelay(2000);

    // Show connected state
    document.getElementById('google-drive-disconnected').classList.add('hidden');
    document.getElementById('google-drive-connected').classList.remove('hidden');
    document.getElementById('google-save-btn').disabled = false;

    updateConnectionStatus(statusEl, 'success', 'Connected');
    showNotification('Google Drive', 'Successfully connected to your account', 'success');
  }

  function disconnectGoogle() {
    document.getElementById('google-drive-disconnected').classList.remove('hidden');
    document.getElementById('google-drive-connected').classList.add('hidden');
    document.getElementById('google-save-btn').disabled = true;

    const statusEl = document.getElementById('google-status');
    updateConnectionStatus(statusEl, 'idle', 'Not connected');
  }

  async function saveGoogleDriveConnection() {
    const activeChips = document.querySelectorAll('#google-file-types .connector-chip.active');
    const fileTypes = Array.from(activeChips).map(chip => chip.dataset.value);

    const connectionData = {
      id: generateId(),
      type: 'google-drive',
      name: 'Google Drive',
      fileTypes,
      folderPath: document.getElementById('google-folder-path').value || '/',
      syncFrequency: document.getElementById('google-sync-frequency').value,
      createdAt: new Date().toISOString()
    };

    state.connections.push(connectionData);
    saveConnectionsToStorage();

    showNotification('Connection Saved', 'Google Drive has been connected', 'success');
    closeModal('google-drive-connector-modal');

    document.dispatchEvent(new CustomEvent('andexaConnectionAdded', { detail: connectionData }));
  }

  // ============================================================================
  // Amazon S3 Modal
  // ============================================================================

  function createS3Modal() {
    const regionOptions = AWS_REGIONS.map(r =>
      `<option value="${r.value}">${r.label}</option>`
    ).join('');

    const content = `
      <div class="connector-modal-container">
        <div class="connector-modal-header">
          <div class="connector-modal-icon" style="background: linear-gradient(135deg, rgba(255, 153, 0, 0.12) 0%, rgba(236, 114, 17, 0.12) 100%); color: #ff9900;">
            <span class="material-symbols-outlined">cloud_queue</span>
          </div>
          <div class="connector-modal-title-group">
            <h2 class="connector-modal-title">Connect Amazon S3</h2>
            <p class="connector-modal-subtitle">Access data from your S3 buckets</p>
          </div>
          <button class="connector-modal-close" onclick="AndexaConnectors.closeS3()" aria-label="Close modal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="connector-modal-body">
          <form id="s3-connection-form" onsubmit="event.preventDefault();">
            <div class="connector-form-group">
              <label class="connector-label" for="s3-access-key">
                Access Key ID <span class="connector-label-required">*</span>
              </label>
              <input type="text" id="s3-access-key" class="connector-input" placeholder="AKIAIOSFODNN7EXAMPLE" required autocomplete="off">
            </div>

            <div class="connector-form-group">
              <label class="connector-label" for="s3-secret-key">
                Secret Access Key <span class="connector-label-required">*</span>
              </label>
              <div class="connector-password-wrapper">
                <input type="password" id="s3-secret-key" class="connector-input" placeholder="Enter your secret key" required autocomplete="off">
                <button type="button" class="connector-password-toggle" onclick="AndexaConnectors.togglePassword('s3-secret-key', this)" aria-label="Toggle password visibility">
                  <span class="material-symbols-outlined">visibility</span>
                </button>
              </div>
              <p class="connector-helper-text">
                <span class="material-symbols-outlined" style="font-size: 14px;">lock</span>
                Your credentials are encrypted and never logged
              </p>
            </div>

            <div class="connector-section-divider">Bucket Configuration</div>

            <div class="connector-form-row">
              <div class="connector-form-group">
                <label class="connector-label" for="s3-bucket">
                  Bucket Name <span class="connector-label-required">*</span>
                </label>
                <input type="text" id="s3-bucket" class="connector-input" placeholder="my-data-bucket" required>
              </div>
              <div class="connector-form-group">
                <label class="connector-label" for="s3-region">
                  Region <span class="connector-label-required">*</span>
                </label>
                <select id="s3-region" class="connector-select" required>
                  <option value="">Select region</option>
                  ${regionOptions}
                </select>
              </div>
            </div>

            <div class="connector-form-group">
              <label class="connector-label" for="s3-prefix">
                Prefix / Folder Path
              </label>
              <input type="text" id="s3-prefix" class="connector-input" placeholder="data/exports/">
              <p class="connector-helper-text">Optional: Limit access to files within this prefix</p>
            </div>

            <div class="connector-form-group">
              <label class="connector-label" for="s3-connection-name">
                Connection Name
              </label>
              <input type="text" id="s3-connection-name" class="connector-input" placeholder="Production S3 Bucket">
            </div>
          </form>
        </div>

        <div class="connector-modal-footer">
          <div class="connector-footer-left">
            <div id="s3-status" class="connector-status connector-status-idle">
              <span class="connector-status-dot"></span>
              <span>Ready to connect</span>
            </div>
          </div>
          <div class="connector-footer-right">
            <button type="button" class="connector-btn connector-btn-secondary" onclick="AndexaConnectors.testS3()">
              <span class="material-symbols-outlined">cable</span>
              Test Connection
            </button>
            <button type="button" class="connector-btn connector-btn-primary" onclick="AndexaConnectors.saveS3()">
              <span class="material-symbols-outlined">save</span>
              Save Connection
            </button>
          </div>
        </div>
      </div>
    `;

    return createModalOverlay('s3-connector-modal', content);
  }

  async function testS3Connection() {
    const form = document.getElementById('s3-connection-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const statusEl = document.getElementById('s3-status');
    updateConnectionStatus(statusEl, 'testing', 'Testing S3 access...');

    await simulateDelay(2000);

    const success = Math.random() > 0.3;
    if (success) {
      updateConnectionStatus(statusEl, 'success', 'Connection successful');
      showNotification('S3 Connection Test', 'Successfully accessed the bucket', 'success');
    } else {
      updateConnectionStatus(statusEl, 'error', 'Access denied');
      showNotification('S3 Connection Test', 'Check your credentials and bucket permissions', 'error');
    }
  }

  async function saveS3Connection() {
    const form = document.getElementById('s3-connection-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const bucket = document.getElementById('s3-bucket').value;
    const connectionData = {
      id: generateId(),
      type: 's3',
      name: document.getElementById('s3-connection-name').value || `S3: ${bucket}`,
      bucket,
      region: document.getElementById('s3-region').value,
      prefix: document.getElementById('s3-prefix').value || '',
      createdAt: new Date().toISOString()
    };

    state.connections.push(connectionData);
    saveConnectionsToStorage();

    showNotification('Connection Saved', `${connectionData.name} has been added`, 'success');
    closeModal('s3-connector-modal');

    document.dispatchEvent(new CustomEvent('andexaConnectionAdded', { detail: connectionData }));
  }

  // ============================================================================
  // REST API Modal
  // ============================================================================

  function createAPIModal() {
    const content = `
      <div class="connector-modal-container" style="max-width: 620px;">
        <div class="connector-modal-header">
          <div class="connector-modal-icon" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(91, 33, 182, 0.12) 100%); color: #7c3aed;">
            <span class="material-symbols-outlined">api</span>
          </div>
          <div class="connector-modal-title-group">
            <h2 class="connector-modal-title">Connect REST API</h2>
            <p class="connector-modal-subtitle">Import data from any REST endpoint</p>
          </div>
          <button class="connector-modal-close" onclick="AndexaConnectors.closeAPI()" aria-label="Close modal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="connector-modal-body">
          <form id="api-connection-form" onsubmit="event.preventDefault();">
            <div class="connector-form-row">
              <div class="connector-form-group" style="flex: 1;">
                <label class="connector-label" for="api-name">
                  API Name <span class="connector-label-required">*</span>
                </label>
                <input type="text" id="api-name" class="connector-input" placeholder="My Data API" required>
              </div>
            </div>

            <div class="connector-form-group">
              <label class="connector-label" for="api-base-url">
                Base URL <span class="connector-label-required">*</span>
              </label>
              <input type="url" id="api-base-url" class="connector-input" placeholder="https://api.example.com/v1" required>
            </div>

            <div class="connector-section-divider">Authentication</div>

            <div class="connector-form-group">
              <label class="connector-label" for="api-auth-type">
                Authentication Type
              </label>
              <select id="api-auth-type" class="connector-select" onchange="AndexaConnectors.onAuthTypeChange(this.value)">
                <option value="none">No Authentication</option>
                <option value="apikey">API Key</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="oauth2">OAuth 2.0</option>
              </select>
            </div>

            <div id="api-auth-fields"></div>

            <div class="connector-section-divider">Custom Headers</div>

            <div class="connector-form-group">
              <div class="connector-kv-editor" id="api-headers-editor">
                <div class="connector-kv-row">
                  <input type="text" class="connector-input" placeholder="Header name" data-header-key>
                  <input type="text" class="connector-input" placeholder="Header value" data-header-value>
                  <button type="button" class="connector-kv-remove" onclick="AndexaConnectors.removeHeader(this)" aria-label="Remove header">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              <button type="button" class="connector-kv-add" onclick="AndexaConnectors.addHeader()">
                <span class="material-symbols-outlined">add</span>
                Add Header
              </button>
            </div>
          </form>
        </div>

        <div class="connector-modal-footer">
          <div class="connector-footer-left">
            <div id="api-status" class="connector-status connector-status-idle">
              <span class="connector-status-dot"></span>
              <span>Ready to test</span>
            </div>
          </div>
          <div class="connector-footer-right">
            <button type="button" class="connector-btn connector-btn-secondary" onclick="AndexaConnectors.testAPI()">
              <span class="material-symbols-outlined">play_arrow</span>
              Test Endpoint
            </button>
            <button type="button" class="connector-btn connector-btn-primary" onclick="AndexaConnectors.saveAPI()">
              <span class="material-symbols-outlined">save</span>
              Save Connection
            </button>
          </div>
        </div>
      </div>
    `;

    return createModalOverlay('api-connector-modal', content);
  }

  function onAuthTypeChange(authType) {
    const container = document.getElementById('api-auth-fields');
    container.innerHTML = '';

    if (authType === 'apikey') {
      container.innerHTML = `
        <div class="connector-form-row">
          <div class="connector-form-group">
            <label class="connector-label" for="api-key-header">Header Name</label>
            <input type="text" id="api-key-header" class="connector-input" placeholder="X-API-Key" value="X-API-Key">
          </div>
          <div class="connector-form-group">
            <label class="connector-label" for="api-key-value">API Key <span class="connector-label-required">*</span></label>
            <div class="connector-password-wrapper">
              <input type="password" id="api-key-value" class="connector-input" placeholder="Enter API key" required>
              <button type="button" class="connector-password-toggle" onclick="AndexaConnectors.togglePassword('api-key-value', this)">
                <span class="material-symbols-outlined">visibility</span>
              </button>
            </div>
          </div>
        </div>
      `;
    } else if (authType === 'bearer') {
      container.innerHTML = `
        <div class="connector-form-group">
          <label class="connector-label" for="api-bearer-token">Bearer Token <span class="connector-label-required">*</span></label>
          <div class="connector-password-wrapper">
            <input type="password" id="api-bearer-token" class="connector-input" placeholder="Enter bearer token" required>
            <button type="button" class="connector-password-toggle" onclick="AndexaConnectors.togglePassword('api-bearer-token', this)">
              <span class="material-symbols-outlined">visibility</span>
            </button>
          </div>
        </div>
      `;
    } else if (authType === 'basic') {
      container.innerHTML = `
        <div class="connector-form-row">
          <div class="connector-form-group">
            <label class="connector-label" for="api-basic-username">Username <span class="connector-label-required">*</span></label>
            <input type="text" id="api-basic-username" class="connector-input" placeholder="Username" required>
          </div>
          <div class="connector-form-group">
            <label class="connector-label" for="api-basic-password">Password <span class="connector-label-required">*</span></label>
            <div class="connector-password-wrapper">
              <input type="password" id="api-basic-password" class="connector-input" placeholder="Password" required>
              <button type="button" class="connector-password-toggle" onclick="AndexaConnectors.togglePassword('api-basic-password', this)">
                <span class="material-symbols-outlined">visibility</span>
              </button>
            </div>
          </div>
        </div>
      `;
    } else if (authType === 'oauth2') {
      container.innerHTML = `
        <div class="connector-form-row">
          <div class="connector-form-group">
            <label class="connector-label" for="api-oauth-client-id">Client ID <span class="connector-label-required">*</span></label>
            <input type="text" id="api-oauth-client-id" class="connector-input" placeholder="Client ID" required>
          </div>
          <div class="connector-form-group">
            <label class="connector-label" for="api-oauth-client-secret">Client Secret <span class="connector-label-required">*</span></label>
            <div class="connector-password-wrapper">
              <input type="password" id="api-oauth-client-secret" class="connector-input" placeholder="Client Secret" required>
              <button type="button" class="connector-password-toggle" onclick="AndexaConnectors.togglePassword('api-oauth-client-secret', this)">
                <span class="material-symbols-outlined">visibility</span>
              </button>
            </div>
          </div>
        </div>
        <div class="connector-form-group">
          <label class="connector-label" for="api-oauth-token-url">Token URL <span class="connector-label-required">*</span></label>
          <input type="url" id="api-oauth-token-url" class="connector-input" placeholder="https://api.example.com/oauth/token" required>
        </div>
      `;
    }
  }

  function addHeader() {
    const editor = document.getElementById('api-headers-editor');
    const row = document.createElement('div');
    row.className = 'connector-kv-row';
    row.innerHTML = `
      <input type="text" class="connector-input" placeholder="Header name" data-header-key>
      <input type="text" class="connector-input" placeholder="Header value" data-header-value>
      <button type="button" class="connector-kv-remove" onclick="AndexaConnectors.removeHeader(this)" aria-label="Remove header">
        <span class="material-symbols-outlined">close</span>
      </button>
    `;
    editor.appendChild(row);
  }

  function removeHeader(button) {
    const row = button.closest('.connector-kv-row');
    const editor = document.getElementById('api-headers-editor');

    // Keep at least one row
    if (editor.querySelectorAll('.connector-kv-row').length > 1) {
      row.remove();
    } else {
      // Clear the inputs instead
      row.querySelector('[data-header-key]').value = '';
      row.querySelector('[data-header-value]').value = '';
    }
  }

  async function testAPIConnection() {
    const form = document.getElementById('api-connection-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const statusEl = document.getElementById('api-status');
    updateConnectionStatus(statusEl, 'testing', 'Testing endpoint...');

    await simulateDelay(2000);

    const success = Math.random() > 0.3;
    if (success) {
      updateConnectionStatus(statusEl, 'success', 'Endpoint reachable');
      showNotification('API Test', 'Successfully connected to the endpoint', 'success');
    } else {
      updateConnectionStatus(statusEl, 'error', 'Request failed');
      showNotification('API Test', 'Could not reach the endpoint', 'error');
    }
  }

  async function saveAPIConnection() {
    const form = document.getElementById('api-connection-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const headers = [];
    document.querySelectorAll('#api-headers-editor .connector-kv-row').forEach(row => {
      const key = row.querySelector('[data-header-key]').value.trim();
      const value = row.querySelector('[data-header-value]').value.trim();
      if (key) {
        headers.push({ key, value });
      }
    });

    const connectionData = {
      id: generateId(),
      type: 'api',
      name: document.getElementById('api-name').value,
      baseUrl: document.getElementById('api-base-url').value,
      authType: document.getElementById('api-auth-type').value,
      headers,
      createdAt: new Date().toISOString()
    };

    state.connections.push(connectionData);
    saveConnectionsToStorage();

    showNotification('Connection Saved', `${connectionData.name} has been added`, 'success');
    closeModal('api-connector-modal');

    document.dispatchEvent(new CustomEvent('andexaConnectionAdded', { detail: connectionData }));
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('.material-symbols-outlined');

    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility_off';
    } else {
      input.type = 'password';
      icon.textContent = 'visibility';
    }
  }

  function toggleChip(chip) {
    chip.classList.toggle('active');
  }

  function updateConnectionStatus(element, status, message) {
    element.className = `connector-status connector-status-${status}`;
    element.querySelector('span:last-child').textContent = message;
  }

  function simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function saveConnectionsToStorage() {
    try {
      localStorage.setItem('andexa-connections', JSON.stringify(state.connections));
    } catch (e) {
      console.error('Failed to save connections:', e);
    }
  }

  function loadConnectionsFromStorage() {
    try {
      const saved = localStorage.getItem('andexa-connections');
      if (saved) {
        state.connections = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load connections:', e);
    }
  }

  // ============================================================================
  // Connection Card Renderer
  // ============================================================================

  function renderConnectionCard(connection) {
    const iconMap = {
      sql: { icon: 'database', class: 'sql' },
      'google-drive': { icon: 'cloud', class: 'google-drive' },
      s3: { icon: 'cloud_queue', class: 's3' },
      api: { icon: 'api', class: 'api' }
    };

    const iconConfig = iconMap[connection.type] || { icon: 'link', class: '' };
    const connected = true; // In real app, check actual connection status

    const card = document.createElement('div');
    card.className = 'connector-card';
    card.setAttribute('data-connection-id', connection.id);
    card.innerHTML = `
      <div class="connector-card-icon ${iconConfig.class}">
        <span class="material-symbols-outlined">${iconConfig.icon}</span>
      </div>
      <div class="connector-card-content">
        <h4 class="connector-card-title">
          ${escapeHtml(connection.name)}
          <span class="connector-card-badge ${connected ? 'connected' : 'disconnected'}">
            ${connected ? 'Connected' : 'Disconnected'}
          </span>
        </h4>
        <p class="connector-card-description">${getConnectionDescription(connection)}</p>
        <div class="connector-card-meta">
          <span class="connector-card-meta-item">
            <span class="material-symbols-outlined">schedule</span>
            Added ${formatRelativeTime(connection.createdAt)}
          </span>
        </div>
      </div>
      <div class="connector-card-actions">
        <button class="connector-card-action" onclick="AndexaConnectors.editConnection('${connection.id}')" title="Edit">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="connector-card-action" onclick="AndexaConnectors.refreshConnection('${connection.id}')" title="Refresh">
          <span class="material-symbols-outlined">refresh</span>
        </button>
        <button class="connector-card-action danger" onclick="AndexaConnectors.deleteConnection('${connection.id}')" title="Disconnect">
          <span class="material-symbols-outlined">link_off</span>
        </button>
      </div>
    `;

    return card;
  }

  function getConnectionDescription(connection) {
    switch (connection.type) {
      case 'sql':
        if (connection.subtype === 'sqlite') {
          return `SQLite: ${connection.path}`;
        }
        return `${DB_TYPES[connection.subtype]?.name || 'Database'}: ${connection.host}:${connection.port}/${connection.database}`;
      case 'google-drive':
        return `Folder: ${connection.folderPath || '/'}`;
      case 's3':
        return `Bucket: ${connection.bucket} (${connection.region})`;
      case 'api':
        return connection.baseUrl;
      default:
        return '';
    }
  }

  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  function deleteConnection(id) {
    const index = state.connections.findIndex(c => c.id === id);
    if (index > -1) {
      const connection = state.connections[index];
      state.connections.splice(index, 1);
      saveConnectionsToStorage();

      const card = document.querySelector(`[data-connection-id="${id}"]`);
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => card.remove(), 200);
      }

      showNotification('Connection Removed', `${connection.name} has been disconnected`, 'info');
      document.dispatchEvent(new CustomEvent('andexaConnectionRemoved', { detail: connection }));
    }
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  function initialize() {
    // Create modals
    createSQLModal();
    createGoogleDriveModal();
    createS3Modal();
    createAPIModal();

    // Load saved connections
    loadConnectionsFromStorage();
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  window.AndexaConnectors = {
    // SQL
    openSQL: () => openModal('sql-connector-modal'),
    closeSQL: () => closeModal('sql-connector-modal'),
    testSQL: testSQLConnection,
    saveSQL: saveSQLConnection,
    onDBTypeChange,

    // Google Drive
    openGoogleDrive: () => openModal('google-drive-connector-modal'),
    closeGoogleDrive: () => closeModal('google-drive-connector-modal'),
    connectGoogle,
    disconnectGoogle,
    saveGoogleDrive: saveGoogleDriveConnection,
    browseGoogleFolder: () => showNotification('Browse Folder', 'Folder picker would open here', 'info'),

    // S3
    openS3: () => openModal('s3-connector-modal'),
    closeS3: () => closeModal('s3-connector-modal'),
    testS3: testS3Connection,
    saveS3: saveS3Connection,

    // API
    openAPI: () => openModal('api-connector-modal'),
    closeAPI: () => closeModal('api-connector-modal'),
    testAPI: testAPIConnection,
    saveAPI: saveAPIConnection,
    onAuthTypeChange,
    addHeader,
    removeHeader,

    // Utilities
    togglePassword,
    toggleChip,

    // Connection Management
    getConnections: () => [...state.connections],
    renderConnectionCard,
    editConnection: (id) => showNotification('Edit', 'Edit functionality coming soon', 'info'),
    refreshConnection: async (id) => {
      showNotification('Refreshing', 'Syncing connection...', 'info');
      await simulateDelay(1500);
      showNotification('Refreshed', 'Connection synced successfully', 'success');
    },
    deleteConnection
  };

})();
