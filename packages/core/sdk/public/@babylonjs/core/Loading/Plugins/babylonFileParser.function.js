/**
 * Stores the list of available parsers in the application.
 */
const _BabylonFileParsers = {};
/**
 * Stores the list of available individual parsers in the application.
 */
const _IndividualBabylonFileParsers = {};
/**
 * Adds a parser in the list of available ones
 * @param name Defines the name of the parser
 * @param parser Defines the parser to add
 */
export function AddParser(name, parser) {
    _BabylonFileParsers[name] = parser;
}
/**
 * Gets a general parser from the list of available ones
 * @param name Defines the name of the parser
 * @returns the requested parser or null
 */
export function GetParser(name) {
    if (_BabylonFileParsers[name]) {
        return _BabylonFileParsers[name];
    }
    return null;
}
/**
 * Adds n individual parser in the list of available ones
 * @param name Defines the name of the parser
 * @param parser Defines the parser to add
 */
export function AddIndividualParser(name, parser) {
    _IndividualBabylonFileParsers[name] = parser;
}
/**
 * Gets an individual parser from the list of available ones
 * @param name Defines the name of the parser
 * @returns the requested parser or null
 */
export function GetIndividualParser(name) {
    if (_IndividualBabylonFileParsers[name]) {
        return _IndividualBabylonFileParsers[name];
    }
    return null;
}
/**
 * Parser json data and populate both a scene and its associated container object
 * @param jsonData Defines the data to parse
 * @param scene Defines the scene to parse the data for
 * @param container Defines the container attached to the parsing sequence
 * @param rootUrl Defines the root url of the data
 */
export function Parse(jsonData, scene, container, rootUrl) {
    for (const parserName in _BabylonFileParsers) {
        if (Object.prototype.hasOwnProperty.call(_BabylonFileParsers, parserName)) {
            _BabylonFileParsers[parserName](jsonData, scene, container, rootUrl);
        }
    }
}
//# sourceMappingURL=babylonFileParser.function.js.map