// Map Component - Leaflet wrapper

class MapComponent {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      center: options.center || [24.7136, 46.6753], // Riyadh
      zoom: options.zoom || 6,
      minZoom: options.minZoom || 5,
      maxZoom: options.maxZoom || 18,
      ...options
    };
    this.map = null;
    this.markers = {};
    this.markerClusterGroup = null;
    this.layers = {
      all: L.layerGroup(),
      online: L.layerGroup(),
      offline: L.layerGroup(),
      warning: L.layerGroup()
    };
    this.currentLayer = 'all';
  }

  // Initialize map
  init() {
    // Create map
    this.map = L.map(this.containerId, {
      center: this.options.center,
      zoom: this.options.zoom,
      minZoom: this.options.minZoom,
      maxZoom: this.options.maxZoom,
      zoomControl: true
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(this.map);

    // Initialize marker cluster group
    this.markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true
    });

    this.map.addLayer(this.markerClusterGroup);

    return this;
  }

  // Create custom marker icon
  createMarkerIcon(status) {
    const colors = {
      online: '#198754',
      offline: '#dc3545',
      warning: '#ffc107'
    };

    const iconHtml = `
      <div class="custom-marker status-${status}">
        <i class="bi bi-geo-alt-fill"></i>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  // Add location marker
  addMarker(location) {
    const icon = this.createMarkerIcon(location.status);
    
    const marker = L.marker(location.coordinates, {
      icon: icon,
      title: location.name
    });

    // Create popup content
    const popupContent = this.createPopupContent(location);
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup'
    });

    // Store marker reference with initial status
    this.markers[location.id] = marker;
    marker._oldStatus = location.status; // Store initial status for layer updates

    // Add to appropriate layers
    this.layers.all.addLayer(marker);
    if (this.layers[location.status]) {
      this.layers[location.status].addLayer(marker);
    }

    // Add to cluster group
    this.markerClusterGroup.addLayer(marker);

    // Add click handler
    marker.on('click', () => {
      this.onMarkerClick(location);
    });

    return marker;
  }

  // Create popup content
  createPopupContent(location) {
    const statusColors = {
      online: 'success',
      offline: 'danger',
      warning: 'warning'
    };

    return `
      <div class="popup-content">
        <div class="popup-header">
          <h6>${location.name}</h6>
          <span class="badge bg-${statusColors[location.status]}">
            <i class="bi bi-circle-fill"></i> ${location.status}
          </span>
        </div>
        <div class="popup-info">
          <div class="info-row">
            <span class="info-label"><i class="bi bi-geo-alt"></i> Location:</span>
            <span class="info-value">${location.region}</span>
          </div>
          <div class="info-row">
            <span class="info-label"><i class="bi bi-building"></i> Type:</span>
            <span class="info-value">${location.branch_type}</span>
          </div>
          <div class="info-row">
            <span class="info-label"><i class="bi bi-hdd-rack"></i> NVRs:</span>
            <span class="info-value">
              <span class="text-success"><i class="bi bi-circle-fill" style="font-size: 0.5rem;"></i> ${location.nvrStatus?.online || 0}</span>
              <span class="text-danger ms-2"><i class="bi bi-circle-fill" style="font-size: 0.5rem;"></i> ${location.nvrStatus?.offline || 0}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label"><i class="bi bi-camera-video"></i> Cameras:</span>
            <span class="info-value">
              <span class="text-success"><i class="bi bi-circle-fill" style="font-size: 0.5rem;"></i> ${location.cameraStatus?.online || 0}</span>
              <span class="text-danger ms-2"><i class="bi bi-circle-fill" style="font-size: 0.5rem;"></i> ${location.cameraStatus?.offline || 0}</span>
            </span>
          </div>
        </div>
        <div class="popup-actions">
          <button class="btn btn-sm btn-primary" onclick="viewLocationDetails(${location.id})">
            <i class="bi bi-eye"></i> Details
          </button>
          <button class="btn btn-sm btn-outline-secondary" onclick="viewLocationCameras(${location.id})">
            <i class="bi bi-camera-video"></i> Cameras
          </button>
        </div>
      </div>
    `;
  }

  // Switch layer
  switchLayer(layerName) {
    if (!this.layers[layerName]) return;

    // Clear cluster group
    this.markerClusterGroup.clearLayers();

    // Add markers from selected layer
    this.layers[layerName].eachLayer(marker => {
      this.markerClusterGroup.addLayer(marker);
    });

    this.currentLayer = layerName;
  }

  // Center map on location
  centerOn(coordinates, zoom = 15) {
    this.map.setView(coordinates, zoom, {
      animate: true,
      duration: 1
    });
  }

  // Fit bounds to all markers
  fitBounds() {
    if (this.markerClusterGroup.getLayers().length > 0) {
      this.map.fitBounds(this.markerClusterGroup.getBounds(), {
        padding: [50, 50]
      });
    }
  }

  // Open marker popup
  openMarker(locationId) {
    const marker = this.markers[locationId];
    if (marker) {
      marker.openPopup();
      this.centerOn(marker.getLatLng());
    }
  }

  // Update marker popup content
  updateMarkerPopup(locationId, location) {
    const marker = this.markers[locationId];
    if (marker) {
      const popupContent = this.createPopupContent(location);
      marker.setPopupContent(popupContent);
    }
  }

  // Remove all markers
  clearMarkers() {
    this.markerClusterGroup.clearLayers();
    Object.values(this.layers).forEach(layer => layer.clearLayers());
    this.markers = {};
  }

  // Event handler (to be overridden)
  onMarkerClick(location) {
    console.log('Marker clicked:', location);
  }

  // Resize map (useful after container size change)
  resize() {
    this.map.invalidateSize();
  }

  // Destroy map
  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

// Export for use in other files
window.MapComponent = MapComponent;

