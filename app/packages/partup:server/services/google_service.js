var d = Debug('services:google');

/**
 @namespace Partup server google service
 @name Partup.server.services.google
 @memberof Partup.server.services
 */
Partup.server.services.google = {

    searchCities: function(query) {
        var key = process.env.GOOGLE_API_KEY;
        var placesAutocomplete = PlacesAutocompletes.findOne({query: query});

        if (placesAutocomplete) {
            d('Autocompleted cities for [' + query + '] from Cache');
            return placesAutocomplete.places;
        }

        // For more details: https://developers.google.com/places/webservice/autocomplete
        var response = HTTP.get('https://maps.googleapis.com/maps/api/place/autocomplete/json?key=' + key + '&input=' + encodeURIComponent(query) + '&types=(cities)');

        if (response.statusCode !== 200) {
            Log.error('Google places api returned with a [' + response.statusCode + ']', response);
            return [];
        }

        var data = get(response, 'data.predictions');

        if (!data) return [];

        PlacesAutocompletes.insert({query: query, created_at: new Date, places: data});

        d('Autocompleted cities for [' + query + '] from Google');

        return data;
    },

    getCity: function(googlePlaceId) {
        var key = process.env.GOOGLE_API_KEY;
        var place = Places.findOne({place_id: googlePlaceId});

        if (place) {
            d('Loaded city with placeId [' + googlePlaceId + '] from Cache');
            return place;
        }

        // For more details: https://developers.google.com/places/webservice/details
        var response = HTTP.get('https://maps.googleapis.com/maps/api/place/details/json?key=' + key + '&placeid=' + googlePlaceId);

        if (response.statusCode !== 200) {
            Log.error('Google places api returned with a [' + response.statusCode + ']', response);
            return {};
        }

        var data = mout.object.get(response, 'data.result');

        if (!data) return {};

        data.place_id = googlePlaceId;
        data.created_at = new Date;

        d('Loaded city with placeId [' + googlePlaceId + '] from Google');

        return Places.insert(data);
    }

};
