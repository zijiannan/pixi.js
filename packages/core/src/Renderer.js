import AbstractRenderer from './AbstractRenderer';
import { sayHello } from '@pixi/utils';
import MaskSystem from './mask/MaskSystem';
import StencilSystem from './mask/StencilSystem';
import FilterSystem from './filters/FilterSystem';
import FramebufferSystem from './framebuffer/FramebufferSystem';
import RenderTextureSystem from './renderTexture/RenderTextureSystem';
import TextureSystem from './textures/TextureSystem';
import ProjectionSystem from './projection/ProjectionSystem';
import StateSystem from './state/StateSystem';
import GeometrySystem from './geometry/GeometrySystem';
import ShaderSystem from './shader/ShaderSystem';
import ContextSystem from './context/ContextSystem';
import BatchSystem from './batch/BatchSystem';
import TextureGCSystem from './textures/TextureGCSystem';
import { RENDERER_TYPE } from '@pixi/constants';
import UniformGroup from './shader/UniformGroup';
import { Matrix } from '@pixi/math';
import Runner from 'mini-runner';

/**
 * The Renderer draws the scene and all its content onto a WebGL enabled canvas. This renderer
 * should be used for browsers that support WebGL. This renderer works by automatically managing WebGLBatches.
 * So no need for Sprite Batches or Sprite Clouds.
 * Don't forget to add the view to your DOM or you will not see anything :).
 *
 * @class
 * @memberof PIXI
 * @extends PIXI.AbstractRenderer
 */
export default class Renderer extends AbstractRenderer
{
    // eslint-disable-next-line valid-jsdoc
    /**
     *
     * @param {object} [options] - The optional renderer parameters.
     * @param {number} [options.width=800] - The width of the screen.
     * @param {number} [options.height=600] - The height of the screen.
     * @param {HTMLCanvasElement} [options.view] - The canvas to use as a view, optional.
     * @param {boolean} [options.transparent=false] - If the render view is transparent.
     * @param {boolean} [options.autoDensity=false] - Resizes renderer view in CSS pixels to allow for
     *   resolutions other than 1.
     * @param {boolean} [options.antialias=false] - Sets antialias. If not available natively then FXAA
     *  antialiasing is used.
     * @param {boolean} [options.forceFXAA=false] - Forces FXAA antialiasing to be used over native.
     *  FXAA is faster, but may not always look as great.
     * @param {number} [options.resolution=1] - The resolution / device pixel ratio of the renderer.
     *  The resolution of the renderer retina would be 2.
     * @param {boolean} [options.clearBeforeRender=true] - This sets if the renderer will clear
     *  the canvas or not before the new render pass. If you wish to set this to false, you *must* set
     *  preserveDrawingBuffer to `true`.
     * @param {boolean} [options.preserveDrawingBuffer=false] - Enables drawing buffer preservation,
     *  enable this if you need to call toDataUrl on the WebGL context.
     * @param {number} [options.backgroundColor=0x000000] - The background color of the rendered area
     *  (shown if not transparent).
     * @param {string} [options.powerPreference] - Parameter passed to WebGL context, set to "high-performance"
     *  for devices with dual graphics card.
     */
    constructor(options = {}, arg2, arg3)
    {
        super('WebGL', options, arg2, arg3);

        /**
         * The type of this renderer as a standardized const
         *
         * @member {number}
         * @see PIXI.RENDERER_TYPE
         */
        this.type = RENDERER_TYPE.WEBGL;

        // this will be set by the contextSystem (this.context)
        this.gl = null;
        this.CONTEXT_UID = 0;

        // TODO legacy!

        /**
         * Internal signal instances of **mini-runner**, these
         * are assigned to each system created.
         * @see https://github.com/GoodBoyDigital/mini-runner
         * @name PIXI.Renderer#runners
         * @type {object}
         * @readonly
         * @property {Runner} destroy - Destroy runner
         * @property {Runner} contextChange - Context change runner
         * @property {Runner} reset - Reset runner
         * @property {Runner} update - Update runner
         * @property {Runner} postrender - Post-render runner
         * @property {Runner} prerender - Pre-render runner
         * @property {Runner} resize - Resize runner
         */
        this.runners = {
            destroy: new Runner('destroy'),
            contextChange: new Runner('contextChange', 1),
            reset: new Runner('reset'),
            update: new Runner('update'),
            postrender: new Runner('postrender'),
            prerender: new Runner('prerender'),
            resize: new Runner('resize', 2),
        };

        /**
         * Global uniforms
         * @member {PIXI.UniformGroup}
         */
        this.globalUniforms = new UniformGroup({
            projectionMatrix: new Matrix(),
        }, true);

        /**
         * Mask system instance
         * @member {PIXI.systems.MaskSystem} mask
         * @memberof PIXI.Renderer#
         * @readonly
         */
        this.addSystem(MaskSystem, 'mask')
            /**
             * Context system instance
             * @member {PIXI.systems.ContextSystem} context
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(ContextSystem, 'context')
            /**
             * State system instance
             * @member {PIXI.systems.StateSystem} state
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(StateSystem, 'state')
            /**
             * Shader system instance
             * @member {PIXI.systems.ShaderSystem} shader
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(ShaderSystem, 'shader')
            /**
             * Texture system instance
             * @member {PIXI.systems.TextureSystem} texture
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(TextureSystem, 'texture')
            /**
             * Geometry system instance
             * @member {PIXI.systems.GeometrySystem} geometry
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(GeometrySystem, 'geometry')
            /**
             * Framebuffer system instance
             * @member {PIXI.systems.FramebufferSystem} framebuffer
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(FramebufferSystem, 'framebuffer')
            /**
             * Stencil system instance
             * @member {PIXI.systems.StencilSystem} stencil
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(StencilSystem, 'stencil')
            /**
             * Projection system instance
             * @member {PIXI.systems.ProjectionSystem} projection
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(ProjectionSystem, 'projection')
            /**
             * Texture garbage collector system instance
             * @member {PIXI.systems.TextureGCSystem} textureGC
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(TextureGCSystem, 'textureGC')
            /**
             * Filter system instance
             * @member {PIXI.systems.FilterSystem} filter
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(FilterSystem, 'filter')
            /**
             * RenderTexture system instance
             * @member {PIXI.systems.RenderTextureSystem} renderTexture
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(RenderTextureSystem, 'renderTexture')
            /**
             * Batch system instance
             * @member {PIXI.systems.BatchSystem} batch
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(BatchSystem, 'batch');

        this.initPlugins(Renderer.__plugins);

        /**
         * The options passed in to create a new WebGL context.
         *
         * @member {object}
         * @private
         */
        if (options.context)
        {
            this.context.initFromContext(options.context);
        }
        else
        {
            this.context.initFromOptions({
                alpha: this.transparent,
                antialias: options.antialias,
                premultipliedAlpha: this.transparent && this.transparent !== 'notMultiplied',
                stencil: true,
                preserveDrawingBuffer: options.preserveDrawingBuffer,
                powerPreference: this.options.powerPreference,
            });
        }

        /**
         * Flag if we are rendering to the screen vs renderTexture
         * @member {boolean}
         * @readonly
         * @default true
         */
        this.renderingToScreen = true;

        sayHello(this.context.webGLVersion === 2 ? 'WebGL 2' : 'WebGL 1');

        this.resize(this.options.width, this.options.height);
    }

    /**
     * Add a new system to the renderer.
     * @param {class} ClassRef - Class reference
     * @param {string} [name] - Property name for system, if not specified
     *        will use a static `name` property on the class itself. This
     *        name will be assigned as s property on the Renderer so make
     *        sure it doesn't collide with properties on Renderer.
     * @return {PIXI.Renderer} Return instance of renderer
     */
    addSystem(ClassRef, name)
    {
        if (!name)
        {
            name = ClassRef.name;
        }

        const system = new ClassRef(this);

        if (this[name])
        {
            throw new Error(`Whoops! The name "${name}" is already in use`);
        }

        this[name] = system;

        for (const i in this.runners)
        {
            this.runners[i].add(system);
        }

        /**
         * Fired after rendering finishes.
         *
         * @event PIXI.Renderer#postrender
         */

        /**
         * Fired before rendering starts.
         *
         * @event PIXI.Renderer#prerender
         */

        /**
         * Fired when the WebGL context is set.
         *
         * @event PIXI.Renderer#context
         * @param {WebGLRenderingContext} gl - WebGL context.
         */

        return this;
    }

    /**
     * Renders the object to its WebGL view
     *
     * @param {PIXI.DisplayObject} displayObject - The object to be rendered.
     * @param {PIXI.RenderTexture} renderTexture - The render texture to render to.
     * @param {boolean} [clear] - Should the canvas be cleared before the new render.
     * @param {PIXI.Matrix} [transform] - A transform to apply to the render texture before rendering.
     * @param {boolean} [skipUpdateTransform] - Should we skip the update transform pass?
     */
    render(displayObject, renderTexture, clear, transform, skipUpdateTransform)
    {
        // can be handy to know!
        this.renderingToScreen = !renderTexture;

        this.runners.prerender.run();
        this.emit('prerender');

        // no point rendering if our context has been blown up!
        if (this.context.isLost)
        {
            return;
        }

        if (!renderTexture)
        {
            this._lastObjectRendered = displayObject;
        }

        if (!skipUpdateTransform)
        {
            // update the scene graph
            const cacheParent = displayObject.parent;

            displayObject.parent = this._tempDisplayObjectParent;
            displayObject.updateTransform();
            displayObject.parent = cacheParent;
            // displayObject.hitArea = //TODO add a temp hit area
        }

        this.renderTexture.bind(renderTexture);
        this.batch.currentRenderer.start();

        if (clear !== undefined ? clear : this.clearBeforeRender)
        {
            this.renderTexture.clear();
        }

        displayObject.render(this);

        // apply transform..
        this.batch.currentRenderer.flush();

        if (renderTexture)
        {
            renderTexture.baseTexture.update();
        }

        this.runners.postrender.run();

        this.emit('postrender');
    }

    /**
     * Resizes the WebGL view to the specified width and height.
     *
     * @param {number} screenWidth - The new width of the screen.
     * @param {number} screenHeight - The new height of the screen.
     */
    resize(screenWidth, screenHeight)
    {
        AbstractRenderer.prototype.resize.call(this, screenWidth, screenHeight);

        this.runners.resize.run(screenWidth, screenHeight);
    }

    /**
     * Resets the WebGL state so you can render things however you fancy!
     *
     * @return {PIXI.Renderer} Returns itself.
     */
    reset()
    {
        this.runners.reset.run();

        return this;
    }

    /**
     * Clear the frame buffer
     */
    clear()
    {
        this.framebuffer.bind();
        this.framebuffer.clear();
    }

    /**
     * Removes everything from the renderer (event listeners, spritebatch, etc...)
     *
     * @param {boolean} [removeView=false] - Removes the Canvas element from the DOM.
     *  See: https://github.com/pixijs/pixi.js/issues/2233
     */
    destroy(removeView)
    {
        this.runners.destroy.run();

        // call base destroy
        super.destroy(removeView);

        // TODO nullify all the managers..
        this.gl = null;
    }

    /**
     * Collection of installed plugins. These are included by default in PIXI, but can be excluded
     * by creating a custom build. Consult the README for more information about creating custom
     * builds and excluding plugins.
     * @name PIXI.Renderer#plugins
     * @type {object}
     * @readonly
     * @property {PIXI.accessibility.AccessibilityManager} accessibility Support tabbing interactive elements.
     * @property {PIXI.extract.WebGLExtract} extract Extract image data from renderer.
     * @property {PIXI.interaction.InteractionManager} interaction Handles mouse, touch and pointer events.
     * @property {PIXI.prepare.WebGLPrepare} prepare Pre-render display objects.
     */

    /**
     * Adds a plugin to the renderer.
     *
     * @method
     * @param {string} pluginName - The name of the plugin.
     * @param {Function} ctor - The constructor function or class for the plugin.
     */
    static registerPlugin(pluginName, ctor)
    {
        Renderer.__plugins = Renderer.__plugins || {};
        Renderer.__plugins[pluginName] = ctor;
    }
}
