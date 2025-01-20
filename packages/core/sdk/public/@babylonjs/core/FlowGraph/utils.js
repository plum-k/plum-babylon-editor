/**
 * @internal
 * Returns if mesh1 is a descendant of mesh2
 * @param mesh1
 * @param mesh2
 * @returns
 */
export function _isADescendantOf(mesh1, mesh2) {
    return !!(mesh1.parent && (mesh1.parent === mesh2 || _isADescendantOf(mesh1.parent, mesh2)));
}
//# sourceMappingURL=utils.js.map