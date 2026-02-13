let googleMap;
let geocoder;
let surplusItems = [];
let mapMarkers = [];

function initMap() {
    console.log('%c[Google Maps] API loaded. Initializing map object.', 'color: purple; font-weight: bold;');
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error("[Fatal] Map element not found in the DOM.");
        return;
    }
    googleMap = new google.maps.Map(mapElement, {
        center: { lat: 1.2966, lng: 103.8521 },
        zoom: 12,
        gestureHandling: "greedy",
    });
    geocoder = new google.maps.Geocoder();
    console.log('%c[Google Maps] Map and Geocoder objects created.', 'color: purple;');

    renderInitialData();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("%c[App] DOM loaded. Initializing application logic...", 'color: green; font-weight: bold;');

    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.interface-section');
    const surplusForm = document.getElementById('surplus-form');
    const calculateBtn = document.getElementById('calculate-surplus');
    const generateReportBtn = document.getElementById('generate-report');
    const modal = document.getElementById('item-modal');
    const closeModalBtn = document.getElementById('close-modal');

    const showSection = (id) => {
        let mapSectionVisible = false;
        sections.forEach(section => {
            if (section.id === id) {
                section.style.display = 'block';
                if (id === 'ngo-section') {
                    mapSectionVisible = true;
                }
            } else {
                section.style.display = 'none';
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });

        if (mapSectionVisible && googleMap) {
            console.log('%c[Google Maps] NGO section visible. Triggering map resize.', 'color: orange; font-weight: bold;');
            google.maps.event.trigger(googleMap, 'resize');
            updateMapMarkers(); 
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = e.target.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });

    calculateBtn.addEventListener('click', handleEstimation);
    surplusForm.addEventListener('submit', handleSurplusSubmit);
    generateReportBtn.addEventListener('click', generateReport);
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display !== 'none') closeModal();
    });

    showSection('donor-section');
});

function renderInitialData() {
    surplusItems = JSON.parse(localStorage.getItem('surplusItems')) || [];
    renderMarketplace();
    updateMapMarkers();
    console.log("%c[App] Initial data rendered.", 'color: green;');
}

function saveState() {
    localStorage.setItem('surplusItems', JSON.stringify(surplusItems));
}

function renderMarketplace() {
    const marketplaceListings = document.getElementById('marketplace-listings');
    marketplaceListings.innerHTML = '';
    if (surplusItems.length === 0) {
        marketplaceListings.innerHTML = '<p class="empty-marketplace">No surplus items currently available.</p>';
        return;
    }
    surplusItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'marketplace-item';
        itemElement.id = item.id;
        itemElement.setAttribute('role', 'button');
        itemElement.setAttribute('tabindex', '0');
        itemElement.innerHTML = `
            <div class="item-header">${item.description}</div>
            <div class="item-body">
                <p><span class="material-icons">inventory_2</span>${item.quantity} units</p>
                <p><span class="material-icons">event_available</span>${new Date(item.expiryDate).toLocaleDateString()}</p>
                <p><span class="material-icons">place</span>${item.donorName}</p>
            </div>
            <div class="item-footer">
                 <span class="status status-${item.status.toLowerCase()}">${item.status}</span>
            </div>
        `;
        itemElement.addEventListener('click', () => openItemModal(item.id));
        itemElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') openItemModal(item.id);
        });
        marketplaceListings.appendChild(itemElement);
    });
}

function updateMapMarkers() {
    if (!googleMap) return;

    mapMarkers.forEach(marker => marker.setMap(null));
    mapMarkers = [];

    const bounds = new google.maps.LatLngBounds();
    const availableItems = surplusItems.filter(item => item.location && item.status === 'Available');

    if (availableItems.length === 0) return;

    availableItems.forEach(item => {
        const position = new google.maps.LatLng(item.location.lat, item.location.lng);
        const marker = new google.maps.Marker({ 
            position, 
            map: googleMap, 
            title: item.description, 
            animation: google.maps.Animation.DROP 
        });
        marker.addListener('click', () => openItemModal(item.id));
        mapMarkers.push(marker);
        bounds.extend(position);
    });

    if (mapMarkers.length > 1) {
        googleMap.fitBounds(bounds);
    } else if (mapMarkers.length === 1) {
        googleMap.setCenter(bounds.getCenter());
        googleMap.setZoom(14);
    }
}

async function handleSurplusSubmit(e) {
    e.preventDefault();
    const newItem = {
        id: `item-${Date.now()}`,
        description: document.getElementById('item-description').value,
        quantity: parseInt(document.getElementById('quantity').value, 10),
        expiryDate: document.getElementById('expiry-date').value,
        pickupAddress: document.getElementById('pickup-address').value,
        donorName: document.getElementById('donor-name').value,
        status: 'Available'
    };

    try {
        const geo = await geocodeAddress(newItem.pickupAddress);
        newItem.location = geo;
    } catch (error) {
        console.error("[Geocoding] Failed:", error);
        alert("Could not find the address. Please check and try again.");
        return;
    }

    surplusItems.push(newItem);
    saveState();
    renderMarketplace();
    updateMapMarkers();
    e.target.reset();
    document.getElementById('surplus-result').style.display = 'none';
}

function geocodeAddress(address) {
    return new Promise((resolve, reject) => {
        if (!geocoder) return reject("Geocoder not initialized");
        geocoder.geocode({ 'address': address }, (results, status) => {
            if (status === 'OK') {
                const location = results[0].geometry.location;
                resolve({ lat: location.lat(), lng: location.lng() });
            } else {
                reject('Geocode was not successful: ' + status);
            }
        });
    });
}

function openItemModal(id) {
    const item = surplusItems.find(i => i.id === id);
    if (!item) return;

    document.getElementById('modal-title').innerText = item.description;
    document.getElementById('modal-body').innerHTML = `
        <p><strong>Donor:</strong> ${item.donorName}</p>
        <p><strong>Quantity:</strong> ${item.quantity} units</p>
        <p><strong>Expiry:</strong> ${new Date(item.expiryDate).toLocaleDateString()}</p>
        <p><strong>Pickup Address:</strong> ${item.pickupAddress}</p>
        <p><strong>Status:</strong> ${item.status}</p>
    `;
    
    const modalFooter = document.getElementById('modal-footer');
    modalFooter.innerHTML = '';
    if (item.status === 'Available') {
        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'btn btn-primary';
        acceptBtn.innerHTML = '<span class="material-icons">check_circle</span> Accept Donation';
        acceptBtn.onclick = () => acceptDonation(item.id);
        modalFooter.appendChild(acceptBtn);
    }

    document.getElementById('item-modal').style.display = 'flex';
}

function acceptDonation(id) {
    const item = surplusItems.find(i => i.id === id);
    if (item) {
        item.status = 'Claimed';
        saveState();
        renderMarketplace();
        updateMapMarkers();
        openItemModal(id);
    }
}

function closeModal() {
    document.getElementById('item-modal').style.display = 'none';
}

function handleEstimation() {
    const planned = parseInt(document.getElementById('planned-pax').value, 10);
    const actual = parseInt(document.getElementById('actual-attendance').value, 10);
    const resultDiv = document.getElementById('surplus-result');

    if (planned > 0 && actual >= 0 && planned >= actual) {
        const surplus = planned - actual;
        const percentage = ((surplus / planned) * 100).toFixed(1);
        resultDiv.innerHTML = `Estimated Surplus: <strong>${surplus}</strong> pax (${percentage}%). <span class="highlight">Consider listing this!</span>`;
        resultDiv.style.display = 'block';
    } else {
        resultDiv.style.display = 'none';
    }
}

function generateReport() {
    if (surplusItems.length === 0) {
        alert('No data to report.');
        return;
    }
    const headers = ['ItemID', 'Description', 'Quantity', 'ExpiryDate', 'Donor', 'Status', 'WasteDiverted_kg', 'CarbonSaved_kgCO2e'];
    const AVG_WEIGHT_PER_UNIT_KG = 0.5;
    const CO2_SAVED_PER_KG = 1.8;
    const rows = surplusItems.map(item => [
        item.id,
        `"${item.description.replace(/"/g, '""')}"`,
        item.quantity,
        item.expiryDate,
        `"${item.donorName.replace(/"/g, '""')}"`,
        item.status,
        (item.status === 'Collected' ? item.quantity * AVG_WEIGHT_PER_UNIT_KG : 0),
        (item.status === 'Collected' ? item.quantity * AVG_WEIGHT_PER_UNIT_KG * CO2_SAVED_PER_KG : 0).toFixed(2)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wegive_impact_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}