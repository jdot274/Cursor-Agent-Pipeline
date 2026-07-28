/**
 * Compatibility shim: @splinetool/loader still imports mergeBufferGeometries
 * (renamed to mergeGeometries in three.js r161+).
 */
export * from '../../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js'
export { mergeGeometries as mergeBufferGeometries } from '../../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js'
