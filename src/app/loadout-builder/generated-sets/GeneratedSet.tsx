import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { editLoadout } from 'app/loadout-drawer/LoadoutDrawer';
import { errorLog } from 'app/utils/log';
import _ from 'lodash';
import React, { Dispatch } from 'react';
import { DimStore } from '../../inventory/store-types';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorSet, LockedMap } from '../types';
import { getPower } from '../utils';
import styles from './GeneratedSet.m.scss';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import SetStats from './SetStats';

interface Props {
  set: ArmorSet;
  selectedStore?: DimStore;
  lockedMap: LockedMap;
  style: React.CSSProperties;
  statOrder: number[];
  forwardedRef?: React.Ref<HTMLDivElement>;
  enabledStats: Set<number>;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  params: LoadoutParameters;
  halfTierMods: PluggableInventoryItemDefinition[];
}

/**
 * A single "stat mix" of builds. Each armor slot contains multiple possibilities,
 * but only the highest light set is displayed.
 */
function GeneratedSet({
  set,
  selectedStore,
  lockedMap,
  style,
  statOrder,
  enabledStats,
  forwardedRef,
  loadouts,
  lbDispatch,
  params,
  halfTierMods,
}: Props) {
  // Set the loadout property to show/hide the loadout menu
  const setCreateLoadout = (loadout: Loadout) => {
    loadout.parameters = params;
    editLoadout(loadout, {
      showClass: false,
    });
  };

  if (set.armor.some((items) => !items.length)) {
    errorLog('loadout optimizer', 'No valid sets!');
    return null;
  }

  const canCompareLoadouts =
    set.armor.every((items) => items[0].classType === selectedStore?.classType) &&
    loadouts.some((l) => l.classType === selectedStore?.classType);

  let existingLoadout: Loadout | undefined;
  let displayedItems: DimItem[] = set.armor.map((items) => items[0]);

  for (const loadout of loadouts) {
    const equippedLoadoutItems = loadout.items.filter((item) => item.equipped);
    const allSetItems = set.armor.flat();
    const intersection = _.intersectionBy(allSetItems, equippedLoadoutItems, (item) => item.id);
    if (intersection.length === set.armor.length) {
      existingLoadout = loadout;
      displayedItems = intersection;
      break;
    }
  }

  return (
    <div className={styles.container} style={style} ref={forwardedRef}>
      <div className={styles.build}>
        <div className={styles.header}>
          <SetStats
            stats={set.stats}
            maxPower={getPower(displayedItems)}
            statOrder={statOrder}
            enabledStats={enabledStats}
            existingLoadoutName={existingLoadout?.name}
            characterClass={selectedStore?.classType}
          />
        </div>
        <div className={styles.items}>
          {displayedItems.map((item, i) => (
            <GeneratedSetItem
              key={item.index}
              item={item}
              itemOptions={set.armor[i]}
              locked={lockedMap[item.bucket.hash]}
              lbDispatch={lbDispatch}
              assignedMods={assignedMods[item.id]}
              showEnergyChanges={Boolean(lockedMods.length)}
            />
          ))}
        </div>
      </div>
      <GeneratedSetButtons
        set={set}
        store={selectedStore!}
        canCompareLoadouts={canCompareLoadouts}
        halfTierMods={halfTierMods}
        onLoadoutSet={setCreateLoadout}
        lbDispatch={lbDispatch}
      />
    </div>
  );
}

export default React.memo(
  React.forwardRef<HTMLDivElement, Props>((props, ref) => (
    <GeneratedSet forwardedRef={ref} {...props} />
  ))
);
