/**
 * Access the HTTP endpoints and add the results to the local collections
 *
 * @class API
 * @memberof Partup.client
 */
Partup.client.API = {

    get: function(url, callback) {
        HTTP.get(url, function(error, result) {
            if (error) callback(error);

            var collectionNames = Object.keys(result.data);

            _.each(collectionNames, function(collectionName) {
                var documents = result.data[collectionName];
                var collection = null;

                switch (collectionName) {
                    case 'activities': collection = Activities; break;
                    case 'contributions': collection = Contributions; break;
                    case 'invites': collection = Invites; break;
                    case 'languages': collection = Languages; break;
                    case 'networks': collection = Networks; break;
                    case 'notifications': collection = Notifications; break;
                    case 'partups': collection = Partups; break;
                    case 'places': collection = Places; break;
                    case 'places_autocompletes': collection = PlacesAutocompletes; break;
                    case 'ratings': collection = Ratings; break;
                    case 'tags': collection = Tags; break;
                    case 'updates': collection = Updates; break;
                    case 'users': collection = Meteor.users; break;
                    case 'cfs.images.filerecord': collection = Images; break;
                    default: return;
                }

                _.each(documents, function(document) {
                    var exists = !!collection.findOne(document._id);
                    if (!exists) collection._collection.insert(document);
                });
            });

            callback();
        });
    }

};
