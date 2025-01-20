import { AndOrNotEvaluator } from "./andOrNotEvaluator.js";
/**
 * Class used to store custom tags
 */
export class Tags {
    /**
     * Adds support for tags on the given object
     * @param obj defines the object to use
     */
    static EnableFor(obj) {
        obj._tags = obj._tags || {};
        obj.hasTags = () => {
            return Tags.HasTags(obj);
        };
        obj.addTags = (tagsString) => {
            return Tags.AddTagsTo(obj, tagsString);
        };
        obj.removeTags = (tagsString) => {
            return Tags.RemoveTagsFrom(obj, tagsString);
        };
        obj.matchesTagsQuery = (tagsQuery) => {
            return Tags.MatchesQuery(obj, tagsQuery);
        };
    }
    /**
     * Removes tags support
     * @param obj defines the object to use
     */
    static DisableFor(obj) {
        delete obj._tags;
        delete obj.hasTags;
        delete obj.addTags;
        delete obj.removeTags;
        delete obj.matchesTagsQuery;
    }
    /**
     * Gets a boolean indicating if the given object has tags
     * @param obj defines the object to use
     * @returns a boolean
     */
    static HasTags(obj) {
        if (!obj._tags) {
            return false;
        }
        const tags = obj._tags;
        for (const i in tags) {
            if (Object.prototype.hasOwnProperty.call(tags, i)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Gets the tags available on a given object
     * @param obj defines the object to use
     * @param asString defines if the tags must be returned as a string instead of an array of strings
     * @returns the tags
     */
    static GetTags(obj, asString = true) {
        if (!obj._tags) {
            return null;
        }
        if (asString) {
            const tagsArray = [];
            for (const tag in obj._tags) {
                if (Object.prototype.hasOwnProperty.call(obj._tags, tag) && obj._tags[tag] === true) {
                    tagsArray.push(tag);
                }
            }
            return tagsArray.join(" ");
        }
        else {
            return obj._tags;
        }
    }
    /**
     * Adds tags to an object
     * @param obj defines the object to use
     * @param tagsString defines the tag string. The tags 'true' and 'false' are reserved and cannot be used as tags.
     * A tag cannot start with '||', '&&', and '!'. It cannot contain whitespaces
     */
    static AddTagsTo(obj, tagsString) {
        if (!tagsString) {
            return;
        }
        if (typeof tagsString !== "string") {
            return;
        }
        const tags = tagsString.split(" ");
        tags.forEach(function (tag) {
            Tags._AddTagTo(obj, tag);
        });
    }
    /**
     * @internal
     */
    static _AddTagTo(obj, tag) {
        tag = tag.trim();
        if (tag === "" || tag === "true" || tag === "false") {
            return;
        }
        if (tag.match(/[\s]/) || tag.match(/^([!]|([|]|[&]){2})/)) {
            return;
        }
        Tags.EnableFor(obj);
        obj._tags[tag] = true;
    }
    /**
     * Removes specific tags from a specific object
     * @param obj defines the object to use
     * @param tagsString defines the tags to remove
     */
    static RemoveTagsFrom(obj, tagsString) {
        if (!Tags.HasTags(obj)) {
            return;
        }
        const tags = tagsString.split(" ");
        for (const t in tags) {
            Tags._RemoveTagFrom(obj, tags[t]);
        }
    }
    /**
     * @internal
     */
    static _RemoveTagFrom(obj, tag) {
        delete obj._tags[tag];
    }
    /**
     * Defines if tags hosted on an object match a given query
     * @param obj defines the object to use
     * @param tagsQuery defines the tag query
     * @returns a boolean
     */
    static MatchesQuery(obj, tagsQuery) {
        if (tagsQuery === undefined) {
            return true;
        }
        if (tagsQuery === "") {
            return Tags.HasTags(obj);
        }
        return AndOrNotEvaluator.Eval(tagsQuery, (r) => Tags.HasTags(obj) && obj._tags[r]);
    }
}
//# sourceMappingURL=tags.js.map