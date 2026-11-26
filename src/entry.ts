import { Plugin } from "@opencode/plugin"
import { compose, PLUGIN_ID } from "./composition"

export default Plugin.define({ id: PLUGIN_ID, setup: compose })
