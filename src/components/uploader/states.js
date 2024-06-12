/**
 * This file will contain uploading stat. We simply export
 * an object, then define some upload states.
 */
export default {
  WAITING   : 'waiting',
  UPLOADING : 'uploading',
  COMPLETE  : 'complete',
  CANCELED  : 'failed',
  FAILED    : 'failed'
};