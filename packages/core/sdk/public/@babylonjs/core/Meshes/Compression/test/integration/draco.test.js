import { DracoDecoder } from "../../dracoDecoder.js";
import { DracoCompression } from "../../dracoCompression.js";
describe("Draco Mesh Compression tests", () => {
    describe("DracoDecoder's configuration is affected by updates to DracoCompression's", () => {
        const originalConfig = { ...DracoDecoder.DefaultConfiguration };
        const testUrl = "testUrl";
        afterEach(() => {
            expect(DracoDecoder.DefaultConfiguration.fallbackUrl).toBe(testUrl);
            expect(DracoDecoder.DefaultConfiguration.fallbackUrl).toBe(DracoCompression.Configuration.decoder.fallbackUrl);
            expect(DracoDecoder.DefaultConfiguration).toBe(DracoCompression.Configuration.decoder);
            DracoDecoder.DefaultConfiguration = originalConfig;
        });
        it("updates via DracoCompression.Configuration.decoder.fallbackUrl", () => {
            DracoCompression.Configuration.decoder.fallbackUrl = testUrl;
        });
        it("updates via DracoCompression.Configuration.decoder", () => {
            DracoCompression.Configuration.decoder = {
                fallbackUrl: testUrl,
            };
        });
        it("updates via DracoCompression.Configuration", () => {
            DracoCompression.Configuration = {
                decoder: {
                    fallbackUrl: testUrl,
                },
            };
        });
    });
});
//# sourceMappingURL=draco.test.js.map