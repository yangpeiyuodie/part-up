Meteor.methods({
    /**
     * Retrieve an authentication token
     */
    'meurs.create_test': function() {
        this.unblock();

        var upper = Meteor.user();
        if (!upper) throw new Meteor.Error(401, 'unauthorized');

        // Set loading state
        Meteor.users.update(upper._id, {$set: {'profile.meurs.initiating_test': true}});

        // Declare vars
        var portal = '';
        var q4youId = '';

        // Define portal
        if (upper.profile.meurs && upper.profile.meurs.portal) {
            portal = upper.profile.meurs.portal;
        } else if (upper.profile.settings.locale) {
            portal = upper.profile.settings.locale;
        } else {
            portal = 'en';
        }

        if (!upper.profile.meurs || !upper.profile.meurs.portal) {
            Meteor.users.update(upper._id, {$set: {'profile.meurs.portal': portal}});
        }

        // Define q4youId
        if (upper.profile.meurs && (portal === 'en' && upper.profile.meurs.en_id)) {
            q4youId = upper.profile.meurs.en_id;
        } else if (upper.profile.meurs && (portal === 'nl' && upper.profile.meurs.nl_id)) {
            q4youId = upper.profile.meurs.nl_id;
        } else {
            q4youId = null;
        }

        // Authenticate
        var token = Partup.server.services.meurs.getToken(portal);

        // Create user if needed
        if (!upper.profile.meurs ||
            (portal === 'en' && !upper.profile.meurs.en_id) ||
            (portal === 'nl' && !upper.profile.meurs.nl_id)
        ) {
            // Add user
            q4youId = Partup.server.services.meurs.addUser(token, upper._id, User(upper).getEmail());

            // Activate user
            var isUserActivated = Partup.server.services.meurs.activateUser(token, q4youId);
            if (!isUserActivated) return false;

            // Update user
            if (portal === 'en') {
                Meteor.users.update(upper._id, {$set: {'profile.meurs.en_id': q4youId}});
            } else if (portal === 'nl') {
                Meteor.users.update(upper._id, {$set: {'profile.meurs.nl_id': q4youId}});
            }
        }

        // Create Program Session if needed
        if (!upper.profile.meurs || !upper.profile.meurs.program_session_id) {
            // Create session
            var programSessionId = Partup.server.services.meurs.createProgramSessionId(portal, token, q4youId);

            // Activate Program Session
            var isProgramSessionActivated = Partup.server.services.meurs.setActiveProgramSession(token, q4youId, programSessionId);
            if (!isProgramSessionActivated) return false;

            // Update user
            Meteor.users.update(upper._id, {$set: {'profile.meurs.program_session_id': programSessionId}});
        }

        // Create return URL
        var returnUrl = Meteor.absoluteUrl() + 'profile/' + upper._id + '/?results_ready=true';

        // Generate browser token and return generated URL to FE
        var testUrl = Partup.server.services.meurs.getBrowserToken(portal, token, q4youId, returnUrl);

        // Unset loading state
        Meteor.users.update(upper._id, {$unset: {'profile.meurs.initiating_test': '', 'profile.meurs.reset': ''}});

        return testUrl;
    },

    'meurs.get_results': function(upperId) {
        this.unblock();

        // Get Upper
        var upper = Meteor.users.findOne({_id: upperId});
        if (!upper) throw new Meteor.Error(404, 'user not found');

        // Check needed data
        if (!upper.profile.meurs ||
            (!upper.profile.meurs.en_id && !upper.profile.meurs.nl_id) ||
            !upper.profile.meurs.portal ||
            !upper.profile.meurs.program_session_id
        ) {
            throw new Meteor.Error(400, 'incomplete_meurs_data');
        }

        // Set user flag
        Meteor.users.update({_id: upper._id}, {$set: {'profile.meurs.fetched_results': true}, $unset: {'profile.meurs.reset': ''}});

        var q4youId = '';
        if (upper.profile.meurs.portal === 'en' && upper.profile.meurs.en_id) {
            q4youId = upper.profile.meurs.en_id;
        } else if (upper.profile.meurs.portal === 'nl' && upper.profile.meurs.nl_id) {
            q4youId = upper.profile.meurs.nl_id;
        }

        // Authenticate
        var token = Partup.server.services.meurs.getToken(upper.profile.meurs.portal);

        // Get service session ID
        var serviceSessionData = Partup.server.services.meurs.getServiceSessionData(token, q4youId);

        // Return null when results are not finalized
        if (!serviceSessionData || serviceSessionData.serviceSessionStatus !== 2) return false;

        // Get results
        var results = Partup.server.services.meurs.getResults(token, serviceSessionData.serviceSessionId);

        // Order results by score and only store the best 2
        var orderedResults = lodash.sortBy(results, function(category) {
            return category.zscore;
        }).reverse().slice(0, 2);

        // Save to user
        Meteor.users.update({_id: upper._id}, {$set: {'profile.meurs.results': orderedResults}});

        return true;
    },

    'meurs.reset': function() {
        this.unblock();

        var upper = Meteor.user();
        if (!upper) throw new Meteor.Error(401, 'unauthorized');

        // Reset test related data
        Meteor.users.update({_id: upper._id}, {
            $set: {
                'profile.meurs.reset': true
            }, $unset: {
                'profile.meurs.portal': '',
                'profile.meurs.program_session_id': '',
                'profile.meurs.fetched_results': ''
            }
        });
    }
});