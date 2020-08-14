export const displayMap = (locations) => {

    mapboxgl.accessToken = 'pk.eyJ1IjoicmFkaGV5YS1hZnJlIiwiYSI6ImNrZDV4Y3U3ZDI1aXgyc283N3R5c3Q4dm0ifQ.LRaQDrBprBOQGutvfKGKCA';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/radheya-afre/ckd5xzkja05j81in4mffavr9g',
        scrollZoom: false 
        // center: [-118.11349,34.111745],
        // zoom: 10,
        // interactive: false
    });

    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(loc => {
        // create Marker
        const el= document.createElement('div');
        el.className = 'marker';

        // add Marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);

        //add popup
        new mapboxgl.Popup({
            offset: 30
        })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day} : ${loc.description}</p>`)
        .addTo(map);

        //extend map bounds to incude current locations
        bounds.extend(loc.coordinates);
        console.log('hiii');
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}
