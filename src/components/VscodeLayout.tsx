import { useEffect, useMemo, useState } from "react";

import { WingSimulatorSchema } from "../../electron/main/wingsdk.js";
import { Breadcrumb, Breadcrumbs } from "../design-system/Breadcrumbs.js";
import { RightResizableWidget } from "../design-system/RightResizableWidget.js";
import { ScrollableArea } from "../design-system/ScrollableArea.js";
import { Tabs } from "../design-system/Tabs.js";
import { TreeMenu } from "../design-system/TreeMenu.js";
import { ResourceIcon, SchemaToTreeMenuItems } from "../stories/utils.js";
import { Node, useNodeMap } from "../utils/nodeMap.js";
import { useTabs } from "../utils/useTabs.js";
import { useTreeMenuItems } from "../utils/useTreeMenuItems.js";

import { Relationships } from "./NodeRelationshipsView.js";
import { NodeTabContents } from "./NodeTabContents.js";
export interface VscodeLayoutProps {
  schema: WingSimulatorSchema | undefined;
}

export const VscodeLayout = ({ schema }: VscodeLayoutProps) => {
  const treeMenu = useTreeMenuItems();
  const tabs = useTabs();
  const nodeMap = useNodeMap(schema?.root);

  function openTab(path: string) {
    const node = nodeMap?.find(path);
    if (node) {
      tabs.openTab({
        id: node.path,
        name: node.id,
        icon: <ResourceIcon resourceType={node.type} className="w-4 h-4" />,
      });
    }
  }

  useEffect(() => {
    treeMenu.setItems(schema ? SchemaToTreeMenuItems(schema) : []);
    tabs.closeAll();
  }, [schema]);

  useEffect(() => {
    treeMenu.expand("");
    treeMenu.expandAll();
    treeMenu.setCurrent("");
    openTab("");
  }, [nodeMap]);

  const breadcrumbs = useMemo(() => {
    let breadcrumbs: Breadcrumb[] = [];
    nodeMap?.visitParents(tabs.currentTabId, (node) => {
      breadcrumbs = [
        {
          id: node.path,
          name: node.id,
          icon: (
            <ResourceIcon
              resourceType={node.type}
              className="w-4 h-4"
              darkenOnGroupHover
            />
          ),
        },
        ...breadcrumbs,
      ];
    });
    return breadcrumbs;
  }, [nodeMap, tabs.currentTabId]);

  const [currentNode, setCurrentNode] = useState<Node>();
  useEffect(() => {
    const node = nodeMap?.find(tabs.currentTabId);
    setCurrentNode(node);
  }, [nodeMap, tabs.currentTabId]);

  const relationships = useMemo(() => {
    if (!currentNode) {
      return;
    }

    const parentNode = nodeMap?.find(currentNode.parent);

    const relationships: Relationships = {
      parent: parentNode
        ? {
            id: parentNode.id,
            path: parentNode.path,
            icon: (
              <ResourceIcon
                resourceType={parentNode.type}
                className="w-4 h-4"
              />
            ),
          }
        : undefined,
      self: {
        id: currentNode.id,
        path: currentNode.path,
        icon: (
          <ResourceIcon resourceType={currentNode.type} className="w-4 h-4" />
        ),
      },
      children: currentNode.children.map((path) => {
        const node = nodeMap?.find(path);
        // todo [sa] handle gracefully
        if (!node) {
          throw new Error(`Node [${path}] doesn't exist`);
        }
        return {
          id: node.id,
          path: node.path,
          icon: <ResourceIcon resourceType={node.type} className="w-4 h-4" />,
        };
      }),
      outbound: currentNode.outbound.map((path) => {
        const node = nodeMap?.find(path);
        if (!node) {
          // todo [sa] need to handle gracefully
          throw new Error(`Node [${path}] doesn't exist`);
        }
        return {
          id: node.id,
          path: node.path,
          icon: <ResourceIcon resourceType={node.type} className="w-4 h-4" />,
        };
      }),
      inbound: currentNode.inbound.map((path) => {
        const node = nodeMap?.find(path);
        if (!node) {
          throw new Error(`Node [${path}] doesn't exist`);
        }
        return {
          id: node.id,
          path: node.path,
          icon: <ResourceIcon resourceType={node.type} className="w-4 h-4" />,
        };
      }),
    };
    return relationships;
  }, [currentNode]);

  return (
    <div className="h-full flex flex-col bg-slate-100 select-none">
      <div className="flex-1 flex">
        <RightResizableWidget className="h-full flex flex-col w-60 min-w-[15rem] min-h-[15rem] border-r border-slate-200">
          <TreeMenu
            title="Wing Application"
            items={treeMenu.items}
            selectedItemId={treeMenu.currentItemId}
            openMenuItemIds={treeMenu.openItemIds}
            onItemClick={(item) => {
              treeMenu.setCurrent(item.id);
              tabs.openTab({
                id: item.id,
                name: item.label,
                icon: item.icon,
              });
            }}
            onItemToggle={(item) => {
              treeMenu.toggle(item.id);
            }}
            onExpandAll={() => treeMenu.expandAll()}
            onCollapseAll={() => treeMenu.collapseAll()}
          />
        </RightResizableWidget>

        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-0">
            <Tabs
              tabs={tabs.tabs}
              currentTabId={tabs.currentTabId}
              onTabClicked={(tab) => {
                tabs.setCurrentTabId(tab.id);
                treeMenu.setCurrent(tab.id);
              }}
              onTabClosed={(tab) => {
                tabs.closeTab(tab.id);
                if (tabs.currentTabId === tab.id) {
                  tabs.setCurrentTabId(undefined);
                  treeMenu.setCurrent(undefined);
                }
              }}
            />
          </div>

          <div className="flex-1 bg-white">
            <div className="h-full flex flex-col">
              <div className="flex-0 w-full h-9 relative">
                {tabs.currentTabId !== undefined && (
                  <ScrollableArea overflowX scrollbarSize="xs">
                    <Breadcrumbs
                      breadcrumbs={breadcrumbs}
                      onBreadcrumbClicked={(breadcrumb) => {
                        treeMenu.expand(breadcrumb.id);
                        treeMenu.setCurrent(breadcrumb.id);
                        tabs.openTab({
                          id: breadcrumb.id,
                          name: breadcrumb.name,
                          icon: breadcrumb.icon,
                        });
                      }}
                    />
                  </ScrollableArea>
                )}
              </div>

              {currentNode && relationships && (
                <NodeTabContents
                  key={currentNode.path}
                  node={currentNode}
                  relationships={relationships}
                  onNodeClick={(path) => {
                    treeMenu.expand(path);
                    treeMenu.setCurrent(path);
                    openTab(path);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
