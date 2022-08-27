(function() {
    'use strict';

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        getClosestAncestor,
        updateTextInput,
    } = window.stash;

    const MIN_REQUIRED_PLUGIN_VERSION = '0.5.0';

    async function runSetStashBoxFavoritePerformersTask() {
        const data = await stash.getStashBoxes();
        if (!data.data.configuration.general.stashBoxes.length) {
            alert('No Stashbox configured.');
        }
        for (const { endpoint } of data.data.configuration.general.stashBoxes) {
            await stash.runPluginTask("userscript_functions", "Set Stashbox Favorite Performers", [{"key":"endpoint", "value":{"str": endpoint}}]);
        }
    }

    async function runSetStashBoxFavoritePerformerTask(endpoint, stashId, favorite) {
        return stash.runPluginTask("userscript_functions", "Set Stashbox Favorite Performer", [{"key":"endpoint", "value":{"str": endpoint}}, {"key":"stash_id", "value":{"str": stashId}}, {"key":"favorite", "value":{"b": favorite}}]);
    }

    stash.addEventListener('page:performers', function () {
        waitForElementClass("btn-toolbar", function () {
            if (!document.getElementById('stashbox-favorite-task')) {
                const toolbar = document.querySelector(".btn-toolbar");

                const newGroup = document.createElement('div');
                newGroup.classList.add('mx-2', 'mb-2', 'd-flex');
                toolbar.appendChild(newGroup);

                const button = document.createElement("button");
                button.setAttribute("id", "stashbox-favorite-task");
                button.classList.add('btn', 'btn-secondary', 'mr-2');
                button.innerHTML = 'Set Stashbox Favorites';
                button.onclick = () => {
                    runSetStashBoxFavoritePerformersTask();
                };
                newGroup.appendChild(button);
            }
        });
    });

    stash.addEventListener('stash:response', function (evt) {
        const data = evt.detail;
        let performers;
        if (data.data?.performerUpdate?.stash_ids?.length) {
            performers = [data.data.performerUpdate];
        }
        else if (data.data?.bulkPerformerUpdate) {
            performers = data.data.bulkPerformerUpdate.filter(performer => performer?.stash_ids?.length);
        }
        if (performers) {
            for (const performer of performers) {
                for (const { endpoint, stash_id } of performer.stash_ids) {
                    runSetStashBoxFavoritePerformerTask(endpoint, stash_id, performer.favorite);
                }
            }
        }
    });

    stash.addEventListener('stash:pluginVersion', async function () {
        if (stash.comparePluginVersion(MIN_REQUIRED_PLUGIN_VERSION) < 0) {
            const alertedPluginVersion = await GM.getValue('alerted_plugin_version');
            if (alertedPluginVersion !== stash.pluginVersion) {
                await GM.setValue('alerted_plugin_version', stash.pluginVersion);
                alert(`User functions plugin version is ${stash.pluginVersion}. Set Stashbox Favorite Performers userscript requires version ${MIN_REQUIRED_PLUGIN_VERSION} or higher.`);
            }
        }
    });

})();