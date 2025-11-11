const securos = require('securos');
const WebSocket = require('ws');

const HOSTNAME = 'DESKTOP-T7MNQIA';
const WS_URL = `ws://192.168.0.30:3000/ws`;

// Auto-reconnect configuration
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectDelay = 1000; // Start with 1 second
const maxReconnectDelay = 1500; // Max 30 seconds
let reconnectTimer = null;
let isManualClose = false;
let heartbeatInterval = null;
let isHeartbeatInProgress = false;

/**
 * 
|Region name  |code|
|-------------|----|
|Riyadh       |RD  |
|Jeddah       |JD  |
|Dammam       |DM  |
|Mecca        |MC  |
|Medina       |MD  |

 */
let region = {
    name: "Riyadh",
    code: "RD",
    timezone: "Asia/Riyadh",
    branches: [] 
}

let currentBranch = {
    name: "Main Branch",
    branch_code: "MB-001",
    branch_type: 'Main Branch',
    address: 'King Fahd Avenue, Diplomatic Quarter, Riyadh 12022, Saudi Arabia',
    coordinates: [24.6574,46.7125],
    status: 'online',
    nvrs: []
}

let initJson = {}

/**
 * Send message via WebSocket with safety checks
 */
function sendWebSocketMessage(message) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('⚠️ WebSocket not open, cannot send message:', message.type);
        return false;
    }
    
    try {
        ws.send(JSON.stringify(message));
        return true;
    } catch (error) {
        console.error('❌ Error sending WebSocket message:', error.message);
        return false;
    }
}

async function getSystemState(core) {
    const SLAVE = await core.getObject('SLAVE', HOSTNAME);
    // console.log(SLAVE);
    let localNvr = {
		"device_name" : SLAVE.name,
		"hostname" : SLAVE.id,
		"processor" : "Intel64 Family 6 Model 141 Stepping 1 GenuineIntel ~2304 Mhz",
		"ram" : "16GB",
		"device_id" : "DAH-455642",
		"product_id" : "00328-90000-00000-AAOEM",
		"system_type" : "x64-based PC",
		"securos_version" : "11.13",
		"ip_address" : SLAVE.params.ip_address,
		"max_cameras" : 5,
		"current_cameras" : 0,
		"status" : SLAVE.params.state === 'CONNECTED' ? "online" : "offline",
		"uptime_percent" : 0,
		// "last_seen" : "2025-10-30T06:58:55.450Z",
		// "installation_date" : "2024-07-17",
		// "previous_maintenance_date" : "2024-08-02",
		// "maintenance_period_days" : 60,
		// "next_maintenance_date" : "2024-10-01",
		// "warranty_expiry" : "2027-07-17",
		"is_active" : true,

        cameras: []
	};

    let grabberIds = await core.getObjectsIds('CAM');
    for (let grabberId of grabberIds) {
        // let grabber = await core.getObject('GRABBER', grabberId);
        let camerasIds = await core.getObjectChildsIds('GRABBER', grabberId, 'CAM');
        // console.log(grabber);
        // console.log(camerasIds);
        if (camerasIds.length > 0) {
            let chan1CamId = camerasIds[0];
            let cam = await core.getObject('CAM', chan1CamId);
            // console.log(cam);
            console.log(cam.params.grabber_ip);
            console.log(cam.params.state);
            let isDetached = cam.params.state.includes('DETACHED');

            let camera = {
                "name" : cam.name,
                "position" : cam.name,
                "ip_address" : cam.params.grabber_ip,
                // "model" : "DS-2CD2385FWD-I",
                // "manufacturer" : "Uniview",
                // "resolution" : "2MP (1920x1080)",
                // "fps" : 30,
                // "bitrate" : 54000,
                // "edge_storage_size" : null,
                "status" : isDetached ? "offline" : "online",
                "uptime_percent" : 0,
            }
            localNvr.cameras.push(camera)
        }
        
    }

    currentBranch.nvrs.push(localNvr);
    region.branches.push(currentBranch);
    initJson = {
        region
    };

    return initJson;
}

let toggleState = 'offline';

async function getSystemStatus(core) {
    const SLAVE = await core.getObject('SLAVE', HOSTNAME);
    // console.log(SLAVE);
    let localNvr = {
		"status" : SLAVE.params.state === 'CONNECTED' ? "online" : "offline",
        cameras: []
	};

    let grabberIds = await core.getObjectsIds('CAM');
    
    // console.log(toggleState);
    // toggleState = toggleState === 'offline' ? 'online' : 'offline';
    // console.log(toggleState);

    for (let grabberId of grabberIds) {
        // let grabber = await core.getObject('GRABBER', grabberId);
        let camerasIds = await core.getObjectChildsIds('GRABBER', grabberId, 'CAM');
        // console.log(grabber);
        // console.log(camerasIds);
        if (camerasIds.length > 0) {
            let chan1CamId = camerasIds[0];
            let cam = await core.getObject('CAM', chan1CamId);
            // console.log(cam.params.grabber_ip);
            // console.log(cam.params.state);
            let isDetached = cam.params.state.includes('DETACHED');
            
            let camera = {
                "name" : cam.name,
                "ip_address" : cam.params.grabber_ip,
                "status" : isDetached ? "offline" : "online",
            }
            localNvr.cameras.push(camera)
        }
        
    }

    return localNvr;
}


/**
 * Connect to WebSocket with auto-reconnect
 */
function connectWebSocket(core) {
    // Don't reconnect if manually closed
    if (isManualClose) {
        return;
    }

    // Clear any existing reconnect timer
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    // Check if already connected
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
    }

    console.log(`🔄 Connecting to WebSocket... (attempt ${reconnectAttempts + 1})`);

    try {
        ws = new WebSocket(WS_URL);

        ws.on('open', async () => {
            console.log('✅ Connected to WebSocket server');
            reconnectAttempts = 0; // Reset on successful connection
            
            let localNvrStatus = await getSystemStatus(core);
            
            // Send authentication message
            const authMessage = {
                type: 'auth',
                hostname: HOSTNAME,
                systemStatus: localNvrStatus
            };
            
            console.log(`📤 Sending auth:`, authMessage);
            ws.send(JSON.stringify(authMessage));
        });

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📥 Received:', message);
                
                if (message.type === 'auth_ok') {
                    console.log(`✅ Authenticated as ${message.hostname} (${message.device_name})`);
                    
                    // Send initialization data
                    console.log('📤 Sending initialization data...');
                    const initMessage = {
                        type: 'initialize',
                        hostname: HOSTNAME,
                        data: initJson
                    };
                    sendWebSocketMessage(initMessage);
                    
                    console.log('💓 Starting heartbeat...');
                    
                    // Clear any existing heartbeat interval
                    if (heartbeatInterval) {
                        clearInterval(heartbeatInterval);
                    }
                    
                    // Reset heartbeat flag
                    isHeartbeatInProgress = false;
                    
                    // Start sending heartbeat every 1.5 seconds
                    heartbeatInterval = setInterval(async () => {
                        // Skip if previous heartbeat is still in progress
                        if (isHeartbeatInProgress) {
                            console.warn('⚠️ Previous heartbeat still in progress, skipping...');
                            return;
                        }
                        
                        // Check WebSocket state before attempting to send
                        if (!ws || ws.readyState !== WebSocket.OPEN) {
                            console.warn('⚠️ WebSocket not open, skipping heartbeat');
                            return;
                        }
                        
                        try {
                            isHeartbeatInProgress = true;
                            
                            let localNvrStatus = await getSystemStatus(core);
                            
                            const heartbeat = {
                                type: 'heartbeat',
                                timestamp: new Date().toISOString(),
                                systemStatus: localNvrStatus
                            };
                            
                            sendWebSocketMessage(heartbeat);
                            console.log('💓 Heartbeat sent');
                            
                        } catch (error) {
                            console.error('❌ Error sending heartbeat:', error.message);
                            console.error(error.stack);
                            // Don't clear interval on error - let it retry next time
                        } finally {
                            isHeartbeatInProgress = false;
                        }
                    }, 1500);
                } else if (message.type === 'initialize_ok') {
                    console.log('✅ Initialization confirmed by server');
                } else if (message.type === 'camera_update_ok') {
                    console.log('✅ Camera update confirmed by server');
                }
            } catch (error) {
                console.error('❌ Error parsing message:', error.message);
            }
        });

        ws.on('close', (code, reason) => {
            console.log(`🔌 Disconnected (code: ${code}, reason: ${reason.toString()})`);
            
            // Clear heartbeat interval
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
            }
            
            // Reset heartbeat flag
            isHeartbeatInProgress = false;
            
            // Attempt reconnect if not manual close
            if (!isManualClose) {
                attemptReconnect(core);
            }
        });

        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
            // Error will trigger close event, which will handle reconnection
        });

    } catch (error) {
        console.error('❌ Error creating WebSocket:', error.message);
        if (!isManualClose) {
            attemptReconnect(core);
        }
    }
}

/**
 * Attempt to reconnect with exponential backoff
 */
function attemptReconnect(core) {
    if (isManualClose) {
        return;
    }

    reconnectAttempts++;
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
        reconnectDelay * Math.pow(2, reconnectAttempts - 1),
        maxReconnectDelay
    );

    console.log(`🔄 Attempting to reconnect (attempt ${reconnectAttempts}) in ${delay}ms...`);
    
    reconnectTimer = setTimeout(() => {
        connectWebSocket(core);
    }, delay);
}

let ws = null; // WebSocket instance

securos.connect(async core => {
    let initJson = await getSystemState(core);
    
    // Initial connection - initialization will be sent after auth_ok
    connectWebSocket(core);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n👋 Closing connection...');
        isManualClose = true;
        
        // Clear reconnect timer
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        
        // Clear heartbeat interval
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
        
        // Reset heartbeat flag
        isHeartbeatInProgress = false;
        
        // Close WebSocket
        if (ws) {
            ws.close();
            ws = null;
        }
        
        process.exit(0);
    });


    // SET_STATE
    // Select All Cameras 
    core.registerEventHandler('CAM', '*', 'ATTACH', async (e) => {
        try {
            let cam = await core.getObject('CAM', e.sourceId);
            let isDetached = cam.params.state.includes('DETACHED');
            
            console.log('📹 Camera attached:', cam.name);
            
            const updateMessage = {
                type: 'camera_update',
                hostname: HOSTNAME,
                camera_name: cam.name,
                status: isDetached ? "offline" : "online"
            };
            
            if (sendWebSocketMessage(updateMessage)) {
                console.log('✅ Camera status update sent via WebSocket');
            }
            
        } catch(e) {
            console.error('❌ Error handling CAM ATTACH:', e.message);
        }
    })

    core.registerEventHandler('CAM', '*', 'DETACH', async (e) => {
        try {
            let cam = await core.getObject('CAM', e.sourceId);
            let isDetached = cam.params.state.includes('DETACHED');
            
            console.log('📹 Camera detached:', cam.name);
            
            const updateMessage = {
                type: 'camera_update',
                hostname: HOSTNAME,
                camera_name: cam.name,
                status: isDetached ? "offline" : "online"
            };
            
            if (sendWebSocketMessage(updateMessage)) {
                console.log('✅ Camera status update sent via WebSocket');
            }
        } catch(e) {
            console.log(e);
            console.error('❌ Error handling CAM DETACH:', e.message);
        }
    })

    // core.registerEventHandler('GRABBER', '*', '*', async (e) => {
    //     console.log(e);
    // })

});
