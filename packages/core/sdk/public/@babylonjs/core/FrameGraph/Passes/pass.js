/**
 * @internal
 */
export class FrameGraphPass {
    constructor(name, _parentTask, _context) {
        this.name = name;
        this._parentTask = _parentTask;
        this._context = _context;
        this.disabled = false;
    }
    setExecuteFunc(func) {
        this._executeFunc = func;
    }
    _execute() {
        if (!this.disabled) {
            this._executeFunc(this._context);
        }
    }
    _isValid() {
        return this._executeFunc !== undefined ? null : "Execute function is not set (call setExecuteFunc to set it)";
    }
}
//# sourceMappingURL=pass.js.map