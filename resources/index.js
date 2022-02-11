// FOURSQUARE API KEY REQUIRED
const geoMap = {
    userAccess: (allowed) => {
        if (allowed) {
            $('#loadingInfo').hide();
            $('#map').height('50vh');
            return;
        }
        $('#locationAside, #mapContainer').hide();
        $('#errorInfo').show();
    },

    getUserCoords: async function() {
        let pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
        return [pos.coords.latitude, pos.coords.longitude];
    },

    initMap: async function() {

        // Check if we have permissions to use GeoLocator
        try {
            this.userPosition = await geoMap.getUserCoords();
            this.userAccess(true);
        } catch {
            this.userAccess(false);
            return false;
        }

        // Map object
        this.geoMapObject = L.map('map', {
            center: this.userPosition,
            zoom: 12
        })

        // Add tile layer
        await L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            minZoom: '15',
        }).addTo(this.geoMapObject)

        this.addUserPin();

        return true;
    },

    addMapPin: (position, description, map) => L.marker(position).addTo(map).bindPopup(`<p1><b>${description}</b></p1>`),

    addMapGroupPins: (nodes) => {
        nodes.forEach(el => geoMap.addMapPin([el.geocodes.main.latitude, el.geocodes.main.longitude], el.name, geoMap.geoMapObject));
        $('#resultInfo').text(`Found ${nodes.length} locations for your search within 5000m of your current position.`)
    },

    addUserPin: () => geoMap.addMapPin(geoMap.userPosition, 'Your location', geoMap.geoMapObject),
}

const locationHelper = {

    checkBoxHandler: (target, name, searchName) => {
        if (target.value != name) return;
        if (!target.checked) return;

        $('.leaflet-popup, .leaflet-marker-icon, .leaflet-marker-shadow').remove();

        geoMap.addUserPin();

        const options = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: 'token here'
            }
        };
        fetch(`https://cors-anywhere.herokuapp.com/https://api.foursquare.com/v3/places/search?query=${searchName}&ll=${geoMap.userPosition[0]}%2C${geoMap.userPosition[1]}&radius=5000`, options)
            .then(response => response.json())
            .then(response => geoMap.addMapGroupPins(response.results))
            .catch(err => console.error(err));
    },

    createCheckBoxElement: (parent, text, elementName, searchFor) => $(parent).append($('<input>', {type: 'radio', name: `radios`, value: elementName}), text, '<br>').on('click', ({target}) => locationHelper.checkBoxHandler(target, elementName, searchFor)),

    initLocations: () => {
        // Create new search radio boxes here.
        /**
         * ( Parent Element, Label Text, Unique String, Search request )
         */
        locationHelper.createCheckBoxElement('#locationBoxContainer', 'Restaurants', 'restr', 'restaurant');
        locationHelper.createCheckBoxElement('#locationBoxContainer', 'Coffee Shops', 'cof', 'coffee');
        locationHelper.createCheckBoxElement('#locationBoxContainer', 'Bars', 'bar', 'bar');
        locationHelper.createCheckBoxElement('#locationBoxContainer', 'Chinese food, Yum!', 'chin', 'chinese');
        locationHelper.createCheckBoxElement('#locationBoxContainer', 'Barber', 'haircut', 'barber');
        locationHelper.createCheckBoxElement('#locationBoxContainer', 'Gas Station', 'gas', 'gas');
    },
}

window.onload = async () => (await geoMap.initMap()) ? locationHelper.initLocations() : null