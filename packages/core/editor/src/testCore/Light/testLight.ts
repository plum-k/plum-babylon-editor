import testDirectionalLight from "./testDirectionalLight"
import testHemisphericLight from "./testHemisphericLight.ts";
import testPointLight from "./testPointLight.ts";
import testSpotLight from "./testSpotLight.ts";

export default function testLight(vi) {
    testDirectionalLight(vi)
    testPointLight(vi)
    testSpotLight(vi)
    testHemisphericLight(vi)
}