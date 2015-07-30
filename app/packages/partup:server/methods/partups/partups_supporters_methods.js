Meteor.methods({
    /**
     * Add a Supporter to a Partup
     *
     * @param {string} partupId
     */
    'partups.supporters.insert': function(partupId) {
        var upper = Meteor.user();
        if (!upper) throw new Meteor.Error(401, 'unauthorized');

        var partup = Partups.findOneOrFail(partupId);

        try {
            var supporters = partup.supporters || [];
            var isAlreadySupporter = !!(supporters.indexOf(upper._id) > -1);

            if (!isAlreadySupporter && partup.creator_id !== upper._id) {
                Partups.update(partupId, {$addToSet: {'supporters': upper._id}});
                Meteor.users.update(upper._id, {$addToSet: {'supporterOf': partupId}});

                Event.emit('partups.supporters.inserted', partup, upper);

                return true;
            }

            return false;
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'user_could_not_be_made_supporter');
        }
    },

    /**
     * Remove a Supporter from a Partup
     *
     * @param {string} partupId
     */
    'partups.supporters.remove': function(partupId) {
        var upper = Meteor.user();
        if (!upper) throw new Meteor.Error(401, 'unauthorized');

        var partup = Partups.findOneOrFail(partupId);

        try {
            var supporters = partup.supporters || [];
            var isSupporter = !!(supporters.indexOf(upper._id) > -1);

            if (isSupporter) {
                Partups.update(partupId, {$pull: {'supporters': upper._id}});
                Meteor.users.update(upper._id, {$pull: {'supporterOf': partupId}});

                Event.emit('partups.supporters.removed', partup, upper);

                return true;
            }

            return false;
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'Upper [' + upper._id + '] could not be remove as a supporter from Partup [' + partupId + '].');
        }
    }
});
