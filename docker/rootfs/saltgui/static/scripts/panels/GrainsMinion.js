/* global document */

import {DropDownMenu} from "../DropDown.js";
import {Output} from "../output/Output.js";
import {Panel} from "./Panel.js";
import {Utils} from "../Utils.js";

export class GrainsMinionPanel extends Panel {

  constructor () {
    super("grains-minion");

    this.addTitle("Grains on ...");
    this.addPanelMenu();
    this._addPanelMenuItemGrainsSetValAdd();
    this._addPanelMenuItemSaltUtilRefreshGrains();

    this.addSearchButton();
    this.addCloseButton();
    this.addTable(["Name", "-menu-", "Value"]);
    this.setTableSortable("Name", "asc");
    this.setTableClickable();
    this.addMsg();
  }

  onShow () {
    const minionId = decodeURIComponent(Utils.getQueryParam("minionid"));

    this.updateTitle("Grains on " + minionId);

    const localGrainsItemsPromise = this.api.getLocalGrainsItems(minionId);

    localGrainsItemsPromise.then((pLocalGrainsItemsData) => {
      this._handleLocalGrainsItems(pLocalGrainsItemsData, minionId);
      return true;
    }, (pLocalGrainsItemsMsg) => {
      this._handleLocalGrainsItems(JSON.stringify(pLocalGrainsItemsMsg), minionId);
      return false;
    });
  }

  _handleLocalGrainsItems (pLocalGrainsItemsData, pMinionId) {
    if (this.showErrorRowInstead(pLocalGrainsItemsData, pMinionId)) {
      return;
    }

    const grains = pLocalGrainsItemsData.return[0][pMinionId];

    if (grains === undefined) {
      this.setMsg("Unknown minion '" + pMinionId + "'");
      return;
    }
    if (grains === false) {
      this.setMsg("Minion '" + pMinionId + "' did not answer");
      return;
    }

    const grainNames = Object.keys(grains).sort();
    for (const grainName of grainNames) {
      const grainTr = document.createElement("tr");

      const grainNameTd = Utils.createTd("grain-name", grainName);
      grainTr.appendChild(grainNameTd);

      const grainValue = Output.formatObject(grains[grainName]);

      const grainMenu = new DropDownMenu(grainTr);
      this._addMenuItemGrainsSetValUpdate(grainMenu, pMinionId, grainName, grains);
      this._addMenuItemGrainsAppendWhenNeeded(grainMenu, pMinionId, grainName, grainValue);
      this._addMenuItemGrainsDelKey(grainMenu, pMinionId, grainName, grains[grainName]);
      this._addMenuItemGrainsDelVal(grainMenu, pMinionId, grainName, grains[grainName]);

      // menu comes before this data on purpose
      const grainValueTd = Utils.createTd("grain-value", grainValue);
      grainTr.appendChild(grainValueTd);

      const tbody = this.table.tBodies[0];
      tbody.appendChild(grainTr);

      grainTr.addEventListener("click", (pClickEvent) => {
        this.runCommand(pClickEvent, pMinionId, ["grains.setval", grainName, grains[grainName]]);
      });
    }

    const txt = Utils.txtZeroOneMany(grainNames.length,
      "No grains", "{0} grain", "{0} grains");
    this.setMsg(txt);
  }

  _addPanelMenuItemGrainsSetValAdd () {
    this.panelMenu.addMenuItem("Add grain...", (pClickEvent) => {
      // use placeholders for name and value
      const minionId = decodeURIComponent(Utils.getQueryParam("minionid"));
      this.runCommand(pClickEvent, minionId, ["grains.setval", "<name>", "<value>"]);
    });
  }

  _addPanelMenuItemSaltUtilRefreshGrains () {
    this.panelMenu.addMenuItem("Refresh grains...", (pClickEvent) => {
      const minionId = decodeURIComponent(Utils.getQueryParam("minionid"));
      this.runCommand(pClickEvent, minionId, ["saltutil.refresh_grains"]);
    });
  }

  _addMenuItemGrainsSetValUpdate (pMenu, pMinionId, key, grains) {
    pMenu.addMenuItem("Edit grain...", (pClickEvent) => {
      this.runCommand(pClickEvent, pMinionId, ["grains.setval", key, grains[key]]);
    });
  }

  _addMenuItemGrainsAppendWhenNeeded (pMenu, pMinionId, key, pGrainValue) {
    if (!pGrainValue.startsWith("[")) {
      return;
    }
    pMenu.addMenuItem("Add value...", (pClickEvent) => {
      this.runCommand(pClickEvent, pMinionId, ["grains.append", key, "<value>"]);
    });
  }

  _addMenuItemGrainsDelKey (pMenu, pMinionId, pKey, pValue) {
    const cmdArr = ["grains.delkey"];
    if (typeof pValue === "object") {
      cmdArr.push("force=", true);
    }
    cmdArr.push(pKey);
    pMenu.addMenuItem("Delete key...", (pClickEvent) => {
      this.runCommand(pClickEvent, pMinionId, cmdArr);
    });
  }

  _addMenuItemGrainsDelVal (pMenu, pMinionId, pKey, pValue) {
    const cmdArr = ["grains.delval"];
    if (typeof pValue === "object") {
      cmdArr.push("force=", true);
    }
    cmdArr.push(pKey);
    pMenu.addMenuItem("Delete value...", (pClickEvent) => {
      this.runCommand(pClickEvent, pMinionId, cmdArr);
    });
  }
}
