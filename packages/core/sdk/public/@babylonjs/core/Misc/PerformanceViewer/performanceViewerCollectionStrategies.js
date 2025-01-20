import { EngineInstrumentation } from "../../Instrumentation/engineInstrumentation.js";
import { PrecisionDate } from "../precisionDate.js";
import { SceneInstrumentation } from "../../Instrumentation/sceneInstrumentation.js";
import { PressureObserverWrapper } from "../pressureObserverWrapper.js";
// Dispose which does nothing.
const defaultDisposeImpl = () => { };
/**
 * Defines the predefined strategies used in the performance viewer.
 */
export class PerfCollectionStrategy {
    /**
     * Gets the initializer for the strategy used for collection of fps metrics
     * @returns the initializer for the fps strategy
     */
    static FpsStrategy() {
        return (scene) => {
            const engine = scene.getEngine();
            return {
                id: "FPS",
                getData: () => engine.getFps(),
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of thermal utilization metrics.
     * Needs the experimental pressure API.
     * @returns the initializer for the thermal utilization strategy
     */
    static ThermalStrategy() {
        return this._PressureStrategy("Thermal utilization", "thermal");
    }
    /**
     * Gets the initializer for the strategy used for collection of power supply utilization metrics.
     * Needs the experimental pressure API.
     * @returns the initializer for the power supply utilization strategy
     */
    static PowerSupplyStrategy() {
        return this._PressureStrategy("Power supply utilization", "power-supply");
    }
    /**
     * Gets the initializer for the strategy used for collection of pressure metrics.
     * Needs the experimental pressure API.
     * @returns the initializer for the pressure strategy
     */
    static PressureStrategy() {
        return this._PressureStrategy("Pressure");
    }
    static _PressureStrategy(name, factor = null) {
        return () => {
            let value = 0;
            const wrapper = new PressureObserverWrapper();
            wrapper.observe("cpu");
            wrapper.onPressureChanged.add((update) => {
                for (const record of update) {
                    if ((factor && record.factors.includes(factor)) || (!factor && (record.factors?.length ?? 0) === 0)) {
                        // Let s consider each step being 25% of the total pressure.
                        switch (record.state) {
                            case "nominal":
                                value = 0;
                                break;
                            case "fair":
                                value = 0.25;
                                break;
                            case "serious":
                                value = 0.5;
                                break;
                            case "critical":
                                value = 1;
                                break;
                        }
                    }
                }
            });
            return {
                id: name,
                getData: () => value,
                dispose: () => wrapper.dispose(),
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of total meshes metrics.
     * @returns the initializer for the total meshes strategy
     */
    static TotalMeshesStrategy() {
        return (scene) => {
            return {
                id: "Total meshes",
                getData: () => scene.meshes.length,
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of active meshes metrics.
     * @returns the initializer for the active meshes strategy
     */
    static ActiveMeshesStrategy() {
        return (scene) => {
            return {
                id: "Active meshes",
                getData: () => scene.getActiveMeshes().length,
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of active indices metrics.
     * @returns the initializer for the active indices strategy
     */
    static ActiveIndicesStrategy() {
        return (scene) => {
            return {
                id: "Active indices",
                getData: () => scene.getActiveIndices(),
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of active faces metrics.
     * @returns the initializer for the active faces strategy
     */
    static ActiveFacesStrategy() {
        return (scene) => {
            return {
                id: "Active faces",
                getData: () => scene.getActiveIndices() / 3,
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of active bones metrics.
     * @returns the initializer for the active bones strategy
     */
    static ActiveBonesStrategy() {
        return (scene) => {
            return {
                id: "Active bones",
                getData: () => scene.getActiveBones(),
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of active particles metrics.
     * @returns the initializer for the active particles strategy
     */
    static ActiveParticlesStrategy() {
        return (scene) => {
            return {
                id: "Active particles",
                getData: () => scene.getActiveParticles(),
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of draw calls metrics.
     * @returns the initializer for the draw calls strategy
     */
    static DrawCallsStrategy() {
        return (scene) => {
            let drawCalls = 0;
            const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
                scene.getEngine()._drawCalls.fetchNewFrame();
            });
            const onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
                drawCalls = scene.getEngine()._drawCalls.current;
            });
            return {
                id: "Draw calls",
                getData: () => drawCalls,
                dispose: () => {
                    scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                    scene.onAfterRenderObservable.remove(onAfterRenderObserver);
                },
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of total lights metrics.
     * @returns the initializer for the total lights strategy
     */
    static TotalLightsStrategy() {
        return (scene) => {
            return {
                id: "Total lights",
                getData: () => scene.lights.length,
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of total vertices metrics.
     * @returns the initializer for the total vertices strategy
     */
    static TotalVerticesStrategy() {
        return (scene) => {
            return {
                id: "Total vertices",
                getData: () => scene.getTotalVertices(),
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of total materials metrics.
     * @returns the initializer for the total materials strategy
     */
    static TotalMaterialsStrategy() {
        return (scene) => {
            return {
                id: "Total materials",
                getData: () => scene.materials.length,
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of total textures metrics.
     * @returns the initializer for the total textures strategy
     */
    static TotalTexturesStrategy() {
        return (scene) => {
            return {
                id: "Total textures",
                getData: () => scene.textures.length,
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of absolute fps metrics.
     * @returns the initializer for the absolute fps strategy
     */
    static AbsoluteFpsStrategy() {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.captureFrameTime = true;
            return {
                id: "Absolute FPS",
                getData: () => {
                    return 1000.0 / sceneInstrumentation.frameTimeCounter.lastSecAverage;
                },
                dispose: defaultDisposeImpl,
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of meshes selection time metrics.
     * @returns the initializer for the meshes selection time strategy
     */
    static MeshesSelectionStrategy() {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeActiveMeshesObserver = scene.onBeforeActiveMeshesEvaluationObservable.add(() => {
                startTime = PrecisionDate.Now;
            });
            const onAfterActiveMeshesObserver = scene.onAfterActiveMeshesEvaluationObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });
            return {
                id: "Meshes Selection",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeActiveMeshesEvaluationObservable.remove(onBeforeActiveMeshesObserver);
                    scene.onAfterActiveMeshesEvaluationObservable.remove(onAfterActiveMeshesObserver);
                },
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of render targets time metrics.
     * @returns the initializer for the render targets time strategy
     */
    static RenderTargetsStrategy() {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeRenderTargetsObserver = scene.onBeforeRenderTargetsRenderObservable.add(() => {
                startTime = PrecisionDate.Now;
            });
            const onAfterRenderTargetsObserver = scene.onAfterRenderTargetsRenderObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });
            return {
                id: "Render Targets",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeRenderTargetsRenderObservable.remove(onBeforeRenderTargetsObserver);
                    scene.onAfterRenderTargetsRenderObservable.remove(onAfterRenderTargetsObserver);
                },
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of particles time metrics.
     * @returns the initializer for the particles time strategy
     */
    static ParticlesStrategy() {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeParticlesObserver = scene.onBeforeParticlesRenderingObservable.add(() => {
                startTime = PrecisionDate.Now;
            });
            const onAfterParticlesObserver = scene.onAfterParticlesRenderingObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });
            return {
                id: "Particles",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeParticlesRenderingObservable.remove(onBeforeParticlesObserver);
                    scene.onAfterParticlesRenderingObservable.remove(onAfterParticlesObserver);
                },
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of sprites time metrics.
     * @returns the initializer for the sprites time strategy
     */
    static SpritesStrategy() {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeSpritesObserver = scene.onBeforeSpritesRenderingObservable?.add(() => {
                startTime = PrecisionDate.Now;
            });
            const onAfterSpritesObserver = scene.onAfterSpritesRenderingObservable?.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });
            return {
                id: "Sprites",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeSpritesRenderingObservable?.remove(onBeforeSpritesObserver);
                    scene.onAfterSpritesRenderingObservable?.remove(onAfterSpritesObserver);
                },
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of animations time metrics.
     * @returns the initializer for the animations time strategy
     */
    static AnimationsStrategy() {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
                startTime = PrecisionDate.Now;
            });
            const onAfterAnimationsObserver = scene.onAfterAnimationsObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });
            return {
                id: "Animations",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                    scene.onAfterAnimationsObservable.remove(onAfterAnimationsObserver);
                },
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of physics time metrics.
     * @returns the initializer for the physics time strategy
     */
    static PhysicsStrategy() {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforePhysicsObserver = scene.onBeforePhysicsObservable?.add(() => {
                startTime = PrecisionDate.Now;
            });
            const onAfterPhysicsObserver = scene.onAfterPhysicsObservable?.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });
            return {
                id: "Physics",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforePhysicsObservable?.remove(onBeforePhysicsObserver);
                    scene.onAfterPhysicsObservable?.remove(onAfterPhysicsObserver);
                },
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of render time metrics.
     * @returns the initializer for the render time strategy
     */
    static RenderStrategy() {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeDrawPhaseObserver = scene.onBeforeDrawPhaseObservable.add(() => {
                startTime = PrecisionDate.Now;
            });
            const onAfterDrawPhaseObserver = scene.onAfterDrawPhaseObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });
            return {
                id: "Render",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeDrawPhaseObservable.remove(onBeforeDrawPhaseObserver);
                    scene.onAfterDrawPhaseObservable.remove(onAfterDrawPhaseObserver);
                },
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of total frame time metrics.
     * @returns the initializer for the total frame time strategy
     */
    static FrameTotalStrategy() {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
                startTime = PrecisionDate.Now;
            });
            const onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });
            return {
                id: "Frame Total",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                    scene.onAfterRenderObservable.remove(onAfterRenderObserver);
                },
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of inter-frame time metrics.
     * @returns the initializer for the inter-frame time strategy
     */
    static InterFrameStrategy() {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });
            const onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
                startTime = PrecisionDate.Now;
            });
            return {
                id: "Inter-frame",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                    scene.onAfterRenderObservable.remove(onAfterRenderObserver);
                },
            };
        };
    }
    /**
     * Gets the initializer for the strategy used for collection of gpu frame time metrics.
     * @returns the initializer for the gpu frame time strategy
     */
    static GpuFrameTimeStrategy() {
        return (scene) => {
            const engineInstrumentation = new EngineInstrumentation(scene.getEngine());
            engineInstrumentation.captureGPUFrameTime = true;
            return {
                id: "GPU frame time",
                getData: () => Math.max(engineInstrumentation.gpuFrameTimeCounter.current * 0.000001, 0),
                dispose: () => {
                    engineInstrumentation.dispose();
                },
            };
        };
    }
}
//# sourceMappingURL=performanceViewerCollectionStrategies.js.map