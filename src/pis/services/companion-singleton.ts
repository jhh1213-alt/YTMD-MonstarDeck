import {ApiServerConnector} from "../../api-server";
import {PluginData} from "../../shared/plugin-data";

let connector: ApiServerConnector | undefined;

export const getCompanionConnector = () => {
    if (!connector) {
        connector = new ApiServerConnector({
            appId: PluginData.APP_ID,
            appName: PluginData.APP_NAME,
            appVersion: PluginData.APP_VERSION,
            host: PluginData.DEFAULT_HOST,
            port: PluginData.DEFAULT_PORT
        });
    }
    return connector;
};
