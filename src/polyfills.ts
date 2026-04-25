/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * Target browsers: evergreen (Chrome, Firefox, Edge, Safari).
 * Legacy IE/older browsers polyfills (classlist.js, web-animations-js, core-js@2,
 * intl) were removed as part of the Angular 18 upgrade baseline (Phase 0).
 *
 * Learn more in https://angular.io/guide/browser-support
 */

/***************************************************************************************************
 * Zone JS is required by Angular itself.
 */
import 'zone.js'; // Included with Angular CLI.

/***************************************************************************************************
 * APPLICATION IMPORTS
 */

if (typeof SVGElement.prototype.contains === 'undefined') {
  SVGElement.prototype.contains = HTMLDivElement.prototype.contains;
}

