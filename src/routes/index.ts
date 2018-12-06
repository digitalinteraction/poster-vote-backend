/*
 *  This index file imports routes and exports a single default for easy use
 *  Its a hard-coded mapping so it plays nicely with typings
 */

import * as general from './general.route'
import * as ivr from './ivr.route'
import * as posters from './posters.route'
import * as users from './users.route'

export { general, ivr, posters, users }
