import React, { useState, useRef, useEffect } from 'react';

// ============================================================================
// Icon Components (replicate Material Symbols)
// ============================================================================
const Icon: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// ============================================================================
// Types
// ============================================================================
interface Rule {
    id: number;
    text: string;
    category: string;
    priority: number;
    active: boolean;
}

interface FileInfo {
    rows: string;
    columns: string;
    size: string;
    filename?: string;
}

interface ChatMessage {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    code?: string;
    analysis?: string;
    commentary?: string;
}

// ============================================================================
// Sidebar Section Component (Accordion)
// ============================================================================
const SidebarSection: React.FC<{
    title: string;
    icon: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}> = ({ title, icon, defaultOpen = true, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="sidebar-section">
            <button
                className="sidebar-section-header"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center flex-1">
                    <Icon name={icon} className="mr-2 text-base" />
                    <h3 className="text-sm font-semibold">{title}</h3>
                </div>
                <Icon
                    name="expand_more"
                    className={`chevron-icon transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            <div className={`sidebar-section-content ${isOpen ? 'block' : 'hidden'}`}>
                {children}
            </div>
        </div>
    );
};

// ============================================================================
// Connector Card Component
// ============================================================================
const ConnectorCard: React.FC<{
    icon: string;
    name: string;
    colorClass: string;
    onClick: () => void;
}> = ({ icon, name, colorClass, onClick }) => (
    <button className={`connector-card ${colorClass}`} onClick={onClick}>
        <div className="connector-icon">
            <Icon name={icon} />
        </div>
        <span className="connector-name">{name}</span>
    </button>
);

// ============================================================================
// Rule Item Component
// ============================================================================
const RuleItem: React.FC<{
    rule: Rule;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}> = ({ rule, onEdit, onDelete }) => (
    <div className="bg-gray-50  rounded-lg p-3 group hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-gray-700  flex-1">{rule.text}</p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(rule.id)}
                    className="p-1 text-gray-500 hover:text-primary  "
                    title="Edit rule"
                >
                    <Icon name="edit" className="text-sm" />
                </button>
                <button
                    onClick={() => onDelete(rule.id)}
                    className="p-1 text-gray-500 hover:text-red-500  "
                    title="Delete rule"
                >
                    <Icon name="delete" className="text-sm" />
                </button>
            </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">{rule.category}</span>
            <span className="text-[10px] text-gray-400">Priority: {rule.priority}</span>
        </div>
    </div>
);

// ============================================================================
// Modal Component
// ============================================================================
const Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    maxWidth?: string;
}> = ({ isOpen, onClose, title, subtitle, icon, children, maxWidth = 'max-w-md' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-container ${maxWidth}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        {icon}
                        <div>
                            <h3 className="text-lg font-semibold">{title}</h3>
                            {subtitle && <p className="text-xs text-gray-500  mt-0.5">{subtitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="modal-close-btn">
                        <Icon name="close" />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Main Andexa Interface Component
// ============================================================================
const AndexaInterface: React.FC = () => {
    // Sidebar State
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // File Info State
    const [fileInfo, setFileInfo] = useState<FileInfo>({ rows: '-', columns: '-', size: '-' });

    // Provider State
    const [provider, setProvider] = useState('groq');
    const [providerStatus, setProviderStatus] = useState<'connected' | 'disconnected' | 'checking'>('connected');

    // Rules State
    const [rules, setRules] = useState<Rule[]>([
        { id: 1, text: 'All visualizations should use colorblind-friendly palettes', category: 'visualization', priority: 5, active: true },
        { id: 2, text: 'Format currency values with symbols and commas', category: 'formatting', priority: 3, active: true },
    ]);

    // Chat State
    const [inputValue, setInputValue] = useState('');
    const [showStartView, setShowStartView] = useState(true);
    const [isDemoActive, setIsDemoActive] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal States
    const [ruleModalOpen, setRuleModalOpen] = useState(false);
    const [connectorModalOpen, setConnectorModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [currentConnector, setCurrentConnector] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

    // Rule Form State
    const [ruleText, setRuleText] = useState('');
    const [ruleCategory, setRuleCategory] = useState('general');
    const [rulePriority, setRulePriority] = useState(3);

    // Refs
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Keyboard shortcut for sidebar toggle (Ctrl/Cmd + B)
    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                setSidebarCollapsed(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, []);

    // Handlers
    const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Simulate file processing
            setFileInfo({
                rows: '1,234',
                columns: '15',
                size: `${(file.size / 1024).toFixed(2)} KB`,
                filename: file.name
            });
        }
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        setShowStartView(false);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        }]);
        setInputValue('');
        setIsLoading(true);

        // Simulate AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: 'I\'ll analyze your request. Here\'s what I found...',
                timestamp: new Date(),
                analysis: 'This is the analysis section explaining the approach.',
                code: `import pandas as pd\nimport plotly.express as px\n\n# Analyze the data\nresult = df.groupby('category').sum()\nfig = px.bar(result, title='Analysis Results')`,
                commentary: 'Based on the analysis, the data shows interesting patterns...'
            }]);
            setIsLoading(false);
        }, 1500);
    };

    const openRuleModal = (rule?: Rule) => {
        if (rule) {
            setEditingRule(rule);
            setRuleText(rule.text);
            setRuleCategory(rule.category);
            setRulePriority(rule.priority);
        } else {
            setEditingRule(null);
            setRuleText('');
            setRuleCategory('general');
            setRulePriority(3);
        }
        setRuleModalOpen(true);
    };

    const saveRule = () => {
        if (!ruleText.trim()) return;

        if (editingRule) {
            setRules(prev => prev.map(r =>
                r.id === editingRule.id
                    ? { ...r, text: ruleText, category: ruleCategory, priority: rulePriority }
                    : r
            ));
        } else {
            setRules(prev => [...prev, {
                id: Date.now(),
                text: ruleText,
                category: ruleCategory,
                priority: rulePriority,
                active: true
            }]);
        }
        setRuleModalOpen(false);
    };

    const deleteRule = (id: number) => {
        setConfirmAction({
            title: 'Delete Rule',
            message: 'Are you sure you want to delete this rule? This action cannot be undone.',
            onConfirm: () => {
                setRules(prev => prev.filter(r => r.id !== id));
                setConfirmModalOpen(false);
            }
        });
        setConfirmModalOpen(true);
    };

    const openConnectorModal = (type: string) => {
        setCurrentConnector(type);
        setConnectorModalOpen(true);
    };

    const startNewChat = () => {
        setConfirmAction({
            title: 'Start New Chat',
            message: 'Are you sure you want to start a new chat? Your current conversation will be saved to recent chats.',
            onConfirm: () => {
                setMessages([]);
                setShowStartView(true);
                setConfirmModalOpen(false);
            }
        });
        setConfirmModalOpen(true);
    };

    const getConnectorConfig = (type: string) => {
        const configs: Record<string, { title: string; icon: string; subtitle: string }> = {
            sql: { title: 'SQL Database', icon: 'database', subtitle: 'Configure your database connection' },
            'google-drive': { title: 'Google Drive', icon: 'add_to_drive', subtitle: 'Connect your Google Drive account' },
            onedrive: { title: 'OneDrive', icon: 'cloud_sync', subtitle: 'Connect your Microsoft OneDrive' },
            s3: { title: 'Amazon S3', icon: 'cloud_circle', subtitle: 'Configure S3 bucket access' },
            api: { title: 'REST API', icon: 'api', subtitle: 'Connect to an API endpoint' },
            ftp: { title: 'FTP/SFTP', icon: 'folder_shared', subtitle: 'Configure file server connection' },
        };
        return configs[type] || { title: 'Custom Connection', icon: 'cable', subtitle: 'Configure custom data source' };
    };

    return (
        <>
            {/* Google Fonts & Material Icons */}
            <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />

            <style>{`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                
                :root {
                    --primary: #1E5F74;
                    --primary-dark: #153E4D;
                    --secondary: #14B8A6;
                    --secondary-dark: #0D9488;
                    --bg-light: #F5F5F5;
                    --bg-dark: #0A0A0A;
                    --surface-light: #FFFFFF;
                    --surface-dark: #1A1A1A;
                }

                body { font-family: 'Sora', sans-serif; }

                .sidebar-section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #374151;
                }
                .sidebar-section-header:hover {
                    background: #f3f4f6;
                }
                .ignore-dark .sidebar-section-header {
                    color: #e5e7eb;
                }
                .ignore-dark .sidebar-section-header:hover {
                    background: #374151;
                }
                
                .sidebar-section-content {
                    padding: 0 0.5rem 0.5rem;
                }

                .connector-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 0.75rem;
                    border-radius: 0.75rem;
                    border: 2px solid #e5e7eb;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    gap: 0.5rem;
                }
                .connector-card:hover {
                    border-color: var(--primary);
                    box-shadow: 0 4px 12px rgba(30, 95, 116, 0.15);
                    transform: translateY(-2px);
                }
                .ignore-dark .connector-card {
                    background: #1f2937;
                    border-color: #374151;
                }
                .ignore-dark .connector-card:hover {
                    border-color: var(--secondary);
                }
                
                .connector-icon {
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    color: white;
                }
                
                .connector-name {
                    font-size: 0.65rem;
                    font-weight: 500;
                    color: #6b7280;
                    text-align: center;
                }
                .ignore-dark .connector-name {
                    color: #9ca3af;
                }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                    padding: 1rem;
                    backdrop-filter: blur(4px);
                }
                
                .modal-container {
                    background: white;
                    border-radius: 1rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .ignore-dark .modal-container {
                    background: #1f2937;
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                .ignore-dark .modal-header {
                    border-bottom-color: #374151;
                }
                
                .modal-close-btn {
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    color: #6b7280;
                    transition: all 0.2s;
                }
                .modal-close-btn:hover {
                    background: #f3f4f6;
                    color: #374151;
                }
                .ignore-dark .modal-close-btn:hover {
                    background: #374151;
                    color: #e5e7eb;
                }
                
                .modal-body {
                    padding: 1.5rem;
                }

                .premium-input-container {
                    background: white;
                    border-radius: 1.5rem;
                    border: 2px solid #e5e7eb;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    transition: all 0.3s;
                }
                .premium-input-container:focus-within {
                    border-color: var(--primary);
                    box-shadow: 0 8px 30px rgba(30, 95, 116, 0.15);
                }
                .ignore-dark .premium-input-container {
                    background: #1f2937;
                    border-color: #374151;
                }
                
                .premium-textarea {
                    background: transparent;
                    border: none;
                    outline: none;
                    resize: none;
                    font-family: inherit;
                    font-size: 0.95rem;
                    color: #1a1a1a;
                    width: 100%;
                }
                .ignore-dark .premium-textarea {
                    color: #f5f5f5;
                }
                .premium-textarea::placeholder {
                    color: #9ca3af;
                }
                
                .premium-attach-btn {
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                }
                .premium-attach-btn:hover {
                    background: #f3f4f6;
                }
                .ignore-dark .premium-attach-btn:hover {
                    background: #374151;
                }
                
                .premium-send-btn {
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .premium-send-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(30, 95, 116, 0.3);
                }
                .premium-send-btn:active {
                    transform: scale(0.95);
                }

                .sidebar-collapsed {
                    transform: translateX(-100%);
                }
                
                @media (min-width: 768px) {
                    .sidebar-collapsed {
                        width: 0;
                        padding: 0;
                        overflow: hidden;
                        transform: none;
                    }
                }
            `}</style>


            <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center transition-all duration-700 ease-in-out">
                {/* Expandable Container */}
                <div
                    className={`
                        relative bg-white shadow-2xl overflow-hidden border border-gray-200 
                        transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)
                        ${isDemoActive ? 'w-full rounded-2xl' : 'w-full max-w-lg rounded-xl hover:shadow-xl hover:scale-[1.02] cursor-default'}
                    `}
                    style={{
                        height: isDemoActive ? '800px' : 'auto'
                    }}
                >
                    {!isDemoActive && (
                        <div className="p-8 flex flex-col items-center text-center space-y-6 bg-gradient-to-br from-white to-gray-50">
                            <div className="h-16 w-16 bg-gradient-to-br from-[#1E5F74] to-[#14B8A6] rounded-2xl flex items-center justify-center shadow-lg mb-2">
                                <svg viewBox="0 0 40 40" className="w-10 h-10">
                                    <circle cx="20" cy="8" r="3" fill="white" />
                                    <circle cx="8" cy="28" r="3" fill="white" />
                                    <circle cx="32" cy="28" r="3" fill="white" />
                                    <circle cx="20" cy="20" r="3" fill="white" />
                                    <line x1="20" y1="8" x2="20" y2="20" stroke="white" strokeWidth="1.5" />
                                    <line x1="8" y1="28" x2="20" y2="20" stroke="white" strokeWidth="1.5" />
                                    <line x1="32" y1="28" x2="20" y2="20" stroke="white" strokeWidth="1.5" />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Experience ANDEXA Live</h2>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                    Interact with the sovereign AI agent designed for Saudi healthcare analytics.
                                </p>
                            </div>

                            <button
                                onClick={() => setIsDemoActive(true)}
                                className="group relative overflow-hidden rounded-full bg-[#1E5F74] text-white px-8 py-3 font-semibold transition-all duration-300 hover:bg-[#153E4D] hover:shadow-lg hover:shadow-[#1E5F74]/30 active:scale-95"
                            >
                                <span className="relative z-10 flex items-center space-x-2">
                                    <span>Test the Demo</span>
                                    <Icon name="arrow_forward" className="text-lg transition-transform duration-300 group-hover:translate-x-1" />
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Browser Content - Only rendered/visible when active or animating */}
                    <div
                        className={`transition-opacity duration-700 delay-300 flex flex-col h-full ${isDemoActive ? 'opacity-100' : 'opacity-0 hidden'}`}
                    >
                        {/* Browser Toolbar/Chrome */}
                        <div className="w-full h-11 bg-gray-100 border-b border-gray-200 flex items-center px-4 space-x-2 flex-shrink-0">
                            <div className="flex space-x-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]"></span>
                                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></span>
                                <span className="w-3 h-3 rounded-full bg-[#28C940] border border-[#1AAB29]"></span>
                            </div>
                            <div className="flex-1 text-center">
                                <span className="text-xs text-gray-500 font-medium bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200">
                                    andexa.ai/interface
                                </span>
                            </div>
                        </div>

                        {/* App Content */}
                        <div className="relative flex-1 bg-[#F5F5F5] overflow-hidden">
                            <div className="flex h-full font-['Sora'] text-[#1A1A1A]">
                                {/* Mobile Backdrop */}
                                {isMobile && !sidebarCollapsed && (
                                    <div
                                        className="fixed inset-0 bg-black/50 z-40"
                                        onClick={toggleSidebar}
                                    />
                                )}

                                {/* Sidebar */}
                                <aside
                                    className={`${isMobile
                                        ? 'fixed top-0 left-0 h-full z-50'
                                        : 'relative'
                                        } w-72 bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'sidebar-collapsed' : ''
                                        }`}
                                >
                                    <div className="p-6 flex flex-col h-full">
                                        {/* Branding */}
                                        <div className="mb-6">
                                            <div className="flex items-center mb-3">
                                                <img
                                                    src="/assets/images/logo.png"
                                                    alt="ANDEXA"
                                                    className="h-10 w-auto"
                                                />
                                            </div>
                                        </div>

                                        {/* Scrollable Sections */}
                                        <div className="flex-1 overflow-y-auto space-y-2">
                                            {/* File Info Section */}
                                            <SidebarSection title="File Info" icon="description">
                                                <div className="text-xs text-gray-500 space-y-2 mt-3">
                                                    <div className="flex justify-between">
                                                        <span>Rows:</span>
                                                        <span className="font-medium text-gray-800 ">{fileInfo.rows}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Columns:</span>
                                                        <span className="font-medium text-gray-800 ">{fileInfo.columns}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Size:</span>
                                                        <span className="font-medium text-gray-800 ">{fileInfo.size}</span>
                                                    </div>
                                                </div>
                                            </SidebarSection>

                                            {/* Data Connectors Section */}
                                            <SidebarSection title="Data Connectors" icon="cable">
                                                <div className="grid grid-cols-3 gap-2 mt-4">
                                                    <ConnectorCard icon="database" name="SQL Database" colorClass="" onClick={() => openConnectorModal('sql')} />
                                                    <ConnectorCard icon="add_to_drive" name="Google Drive" colorClass="" onClick={() => openConnectorModal('google-drive')} />
                                                    <ConnectorCard icon="cloud_sync" name="OneDrive" colorClass="" onClick={() => openConnectorModal('onedrive')} />
                                                    <ConnectorCard icon="cloud_circle" name="Amazon S3" colorClass="" onClick={() => openConnectorModal('s3')} />
                                                    <ConnectorCard icon="api" name="REST API" colorClass="" onClick={() => openConnectorModal('api')} />
                                                    <ConnectorCard icon="folder_shared" name="FTP/SFTP" colorClass="" onClick={() => openConnectorModal('ftp')} />
                                                </div>
                                                <button
                                                    className="w-full text-xs px-3 py-2.5 mt-4 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0D9488] transition-all duration-200 flex items-center justify-center space-x-1.5 shadow-sm hover:shadow-md"
                                                    onClick={() => openConnectorModal('custom')}
                                                >
                                                    <Icon name="add_circle" className="text-sm" />
                                                    <span className="font-medium">Add Connection</span>
                                                </button>
                                            </SidebarSection>

                                            {/* LLM Provider Section */}
                                            <SidebarSection title="LLM Provider" icon="smart_toy">
                                                <div className="mt-3 space-y-2">
                                                    <select
                                                        value={provider}
                                                        onChange={(e) => setProvider(e.target.value)}
                                                        className="w-full text-xs px-3 py-2 bg-gray-100 text-gray-900 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E5F74]/20"
                                                    >
                                                        <option value="groq">Groq (Kimi K2) - Cloud</option>
                                                        <option value="lmstudio">LM Studio - Local</option>
                                                        <option value="zai">Z.AI (GLM 4.6) - Cloud</option>
                                                    </select>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-500 ">Status:</span>
                                                        <span className="flex items-center">
                                                            <span className={`w-2 h-2 rounded-full mr-1 ${providerStatus === 'connected' ? 'bg-green-500' :
                                                                providerStatus === 'disconnected' ? 'bg-red-500' : 'bg-amber-500'
                                                                }`} />
                                                            <span className="text-gray-700 ">
                                                                {providerStatus === 'connected' ? 'Connected' :
                                                                    providerStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </SidebarSection>

                                            {/* Custom Rules Section */}
                                            <SidebarSection title="Custom Rules" icon="rule">
                                                <button
                                                    className="w-full text-xs px-3 py-2 mt-3 bg-[#1E5F74] text-white rounded hover:bg-[#153E4D] transition-colors flex items-center justify-center space-x-1"
                                                    onClick={() => openRuleModal()}
                                                >
                                                    <Icon name="add" className="text-sm" />
                                                    <span>Add Rule</span>
                                                </button>
                                                <div className="space-y-2 max-h-32 overflow-y-auto mt-3">
                                                    {rules.length === 0 ? (
                                                        <p className="text-center py-2 text-xs text-gray-500">No custom rules defined</p>
                                                    ) : (
                                                        rules.map(rule => (
                                                            <RuleItem
                                                                key={rule.id}
                                                                rule={rule}
                                                                onEdit={(id) => openRuleModal(rules.find(r => r.id === id))}
                                                                onDelete={deleteRule}
                                                            />
                                                        ))
                                                    )}
                                                </div>
                                            </SidebarSection>

                                            {/* Recent Chats Section */}
                                            <SidebarSection title="Recent Chats" icon="chat">
                                                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                                                    <p className="text-center text-xs text-gray-500 py-4">No recent chats</p>
                                                </div>
                                            </SidebarSection>

                                            {/* Settings Section */}
                                            <SidebarSection title="Settings" icon="settings">
                                                <div className="mt-3 space-y-2 text-xs text-gray-500 ">
                                                    <p className="text-center py-2">Settings options coming soon</p>
                                                </div>
                                            </SidebarSection>
                                        </div>

                                        {/* New Chat Button */}
                                        <div className="mt-4 pt-4 border-t border-gray-200 ">
                                            <button
                                                className="w-full bg-[#1E5F74] text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#153E4D] transition-all duration-300"
                                                onClick={startNewChat}
                                            >
                                                <Icon name="add" />
                                                <span>New Chat</span>
                                            </button>
                                        </div>
                                    </div>
                                </aside>

                                {/* Main Content */}
                                <main className="flex-1 flex flex-col relative w-full overflow-hidden">
                                    {/* Header */}
                                    <header className="flex justify-between items-center p-4 relative z-30">
                                        <button
                                            onClick={toggleSidebar}
                                            className="p-2 text-gray-600 hover:text-[#1E5F74] hover:bg-gray-100 rounded-lg transition-all duration-200"
                                            aria-label="Toggle sidebar"
                                        >
                                            <Icon name="menu" className="text-2xl" />
                                        </button>


                                    </header>

                                    {/* Chat Start View */}
                                    {showStartView && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 md:px-8 lg:px-12 relative z-10 overflow-auto">
                                            <div className="p-6 bg-white rounded-xl shadow-md mb-6">
                                                <img
                                                    src="/assets/images/logo.png"
                                                    alt="ANDEXA"
                                                    className="h-12 w-auto mx-auto"
                                                />
                                            </div>
                                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">How can I help you today?</h2>
                                            <p className="text-gray-600 max-w-lg">Start by uploading a file or ask me a general question. I can help you with Excel files, documents, and more.</p>

                                            {/* Example Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 w-full max-w-3xl">
                                                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-300 text-left">
                                                    <div className="flex items-center text-[#1E5F74] mb-3">
                                                        <Icon name="lightbulb" className="text-3xl" />
                                                        <h3 className="font-semibold text-lg ml-2">Examples</h3>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-4">"Summarize the key findings from the attached sales report."</p>
                                                    <p className="text-sm text-gray-600 mb-4">"Which product had the highest growth in Q4?"</p>
                                                    <p className="text-sm text-gray-600 ">"Create a bar chart showing sales by region."</p>
                                                </div>
                                                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-300 text-left">
                                                    <div className="flex items-center text-[#1E5F74] mb-3">
                                                        <Icon name="build_circle" className="text-3xl" />
                                                        <h3 className="font-semibold text-lg ml-2">Capabilities</h3>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-4">Understands complex queries about your data.</p>
                                                    <p className="text-sm text-gray-600 mb-4">Can generate charts and visualizations.</p>
                                                    <p className="text-sm text-gray-600 ">Supports multiple languages and file formats.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Conversation View */}
                                    {!showStartView && (
                                        <div className="flex-1 overflow-y-auto pb-4 px-4 relative z-10 w-full">
                                            <div className="max-w-4xl mx-auto space-y-4 w-full">
                                                {messages.map(msg => (
                                                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] rounded-2xl p-4 ${msg.type === 'user'
                                                            ? 'bg-[#1E5F74] text-white'
                                                            : 'bg-white border border-gray-200 '
                                                            }`}>
                                                            {msg.type === 'assistant' && msg.analysis && (
                                                                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                                                                    <h4 className="text-xs font-semibold text-blue-600 mb-1">Analysis</h4>
                                                                    <p className="text-sm text-gray-700 ">{msg.analysis}</p>
                                                                </div>
                                                            )}
                                                            {msg.type === 'assistant' && msg.code && (
                                                                <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 ">
                                                                    <div className="bg-gray-100 px-3 py-2 flex justify-between items-center">
                                                                        <span className="text-xs font-semibold text-[#1E5F74] uppercase">Python</span>
                                                                        <button className="text-xs px-2 py-1 bg-[#1E5F74] text-white rounded hover:bg-[#153E4D]">Copy</button>
                                                                    </div>
                                                                    <pre className="p-3 text-xs overflow-x-auto bg-white ">
                                                                        <code className="text-gray-800 ">{msg.code}</code>
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            <p className={msg.type === 'user' ? 'text-white' : 'text-gray-700 '}>{msg.content}</p>
                                                            {msg.type === 'assistant' && msg.commentary && (
                                                                <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                                                                    <h4 className="text-xs font-semibold text-green-600 mb-1">Commentary</h4>
                                                                    <p className="text-sm text-gray-700 ">{msg.commentary}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {isLoading && (
                                                    <div className="flex justify-start">
                                                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                                                            <div className="flex space-x-2">
                                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Input Area */}
                                    <div className="p-6 md:p-8 lg:p-12 pt-4 relative z-10 w-full mb-0">
                                        <div className="premium-input-wrapper max-w-3xl mx-auto w-full">
                                            <div className="premium-input-container">
                                                <div className="relative flex items-center gap-3 p-3">
                                                    {/* Attach File Button */}
                                                    <button className="premium-attach-btn p-2.5 flex-shrink-0">
                                                        <label className="cursor-pointer flex items-center justify-center" htmlFor="file-upload">
                                                            <Icon name="attach_file" className="text-xl text-gray-600 " />
                                                        </label>
                                                        <input
                                                            ref={fileInputRef}
                                                            className="hidden"
                                                            id="file-upload"
                                                            type="file"
                                                            accept=".csv,.xlsx,.xls"
                                                            onChange={handleFileUpload}
                                                        />
                                                    </button>

                                                    {/* Textarea */}
                                                    <textarea
                                                        ref={inputRef}
                                                        className="premium-textarea flex-1 py-2.5 px-1 max-h-32 overflow-y-auto"
                                                        placeholder="Ask a question or upload a file..."
                                                        rows={1}
                                                        value={inputValue}
                                                        onChange={(e) => setInputValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSend();
                                                            }
                                                        }}
                                                    />

                                                    {/* Voice Input Button */}
                                                    <button className="premium-attach-btn p-2.5 flex-shrink-0" title="Voice input (Alt+R)">
                                                        <Icon name="mic" className="text-xl text-gray-600 " />
                                                    </button>

                                                    {/* Send Button */}
                                                    <button
                                                        className="premium-send-btn text-white w-12 h-12 flex-shrink-0 flex items-center justify-center"
                                                        onClick={handleSend}
                                                    >
                                                        <Icon name="send" className="text-xl" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </main>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Rule Modal */}
            <Modal
                isOpen={ruleModalOpen}
                onClose={() => setRuleModalOpen(false)}
                title={editingRule ? 'Edit Custom Rule' : 'Add Custom Rule'}
            >
                <form onSubmit={(e) => { e.preventDefault(); saveRule(); }}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700  mb-2">
                            Rule Text <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            maxLength={500}
                            required
                            className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-[#1E5F74] focus:border-transparent bg-white  text-gray-900 "
                            placeholder="Enter your analysis rule or instruction..."
                            value={ruleText}
                            onChange={(e) => setRuleText(e.target.value)}
                        />
                        <p className="text-xs text-gray-500  mt-1">
                            {ruleText.length}/500 characters
                        </p>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700  mb-2">Category</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-[#1E5F74] focus:border-transparent bg-white  text-gray-900 "
                            value={ruleCategory}
                            onChange={(e) => setRuleCategory(e.target.value)}
                        >
                            <option value="general">General</option>
                            <option value="analysis">Analysis</option>
                            <option value="visualization">Visualization</option>
                            <option value="formatting">Formatting</option>
                            <option value="data">Data Processing</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700  mb-2">
                            Priority: {rulePriority}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            value={rulePriority}
                            onChange={(e) => setRulePriority(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer "
                        />
                        <div className="flex justify-between text-xs text-gray-500  mt-1">
                            <span>Low</span>
                            <span>Medium</span>
                            <span>High</span>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setRuleModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700  bg-gray-100  rounded-lg hover:bg-gray-200  transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-[#1E5F74] rounded-lg hover:bg-[#153E4D] transition-colors"
                        >
                            Save Rule
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Connector Modal */}
            <Modal
                isOpen={connectorModalOpen}
                onClose={() => setConnectorModalOpen(false)}
                title={getConnectorConfig(currentConnector).title}
                subtitle={getConnectorConfig(currentConnector).subtitle}
                icon={
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E5F74] to-[#14B8A6] flex items-center justify-center text-white">
                        <Icon name={getConnectorConfig(currentConnector).icon} />
                    </div>
                }
                maxWidth="max-w-lg"
            >
                <form onSubmit={(e) => { e.preventDefault(); setConnectorModalOpen(false); }}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700  mb-2">
                                Connection Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-[#1E5F74] focus:border-transparent bg-white  text-gray-900 "
                                placeholder="e.g., Production Database"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">A friendly name to identify this connection</p>
                        </div>

                        {currentConnector === 'sql' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700  mb-2">Database Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['MySQL', 'PostgreSQL', 'SQLite', 'SQL Server'].map(db => (
                                            <button
                                                key={db}
                                                type="button"
                                                className="px-3 py-1.5 text-xs rounded-full border-2 border-gray-200  hover:border-[#1E5F74] transition-colors"
                                            >
                                                {db}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700  mb-2">
                                        Host / Server <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-[#1E5F74] focus:border-transparent bg-white  text-gray-900 "
                                        placeholder="localhost or 192.168.1.100"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700  mb-2">Port</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-[#1E5F74] focus:border-transparent bg-white  text-gray-900 "
                                            placeholder="3306"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700  mb-2">
                                            Database <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-[#1E5F74] focus:border-transparent bg-white  text-gray-900 "
                                            placeholder="my_database"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700  mb-2">Username</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-[#1E5F74] focus:border-transparent bg-white  text-gray-900 "
                                            placeholder="db_user"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700  mb-2">Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-[#1E5F74] focus:border-transparent bg-white  text-gray-900 "
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {(currentConnector === 'google-drive' || currentConnector === 'onedrive') && (
                            <div className="py-4">
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1E5F74] text-white rounded-lg hover:bg-[#153E4D] transition-colors"
                                >
                                    <Icon name="login" className="text-lg" />
                                    <span>Sign in with {currentConnector === 'google-drive' ? 'Google' : 'Microsoft'}</span>
                                </button>
                                <p className="text-xs text-gray-500 text-center mt-2">You will be redirected to authenticate</p>
                            </div>
                        )}

                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-700  bg-gray-100  rounded-lg hover:bg-gray-200  transition-colors"
                        >
                            <Icon name="lan" className="text-base" />
                            <span>Test Connection</span>
                        </button>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 ">
                        <button
                            type="button"
                            onClick={() => setConnectorModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700  bg-gray-100  rounded-lg hover:bg-gray-200  transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-[#14B8A6] rounded-lg hover:bg-[#0D9488] transition-colors"
                        >
                            Save Connection
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Modal */}
            <Modal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                title={confirmAction?.title || 'Confirm Action'}
            >
                <p className="text-gray-700  mb-6">{confirmAction?.message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => setConfirmModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700  bg-gray-100  rounded-lg hover:bg-gray-200  transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmAction?.onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default AndexaInterface;