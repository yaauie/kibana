/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IconType } from '@elastic/eui';
import { ConnectorTypes } from '../../common';
import { FieldConfig, ValidationConfig } from '../common/shared_imports';
import { StartPlugins } from '../types';
import { connectorValidator as swimlaneConnectorValidator } from './connectors/swimlane/validator';
import { connectorValidator as servicenowConnectorValidator } from './connectors/servicenow/validator';
import { CaseActionConnector } from './types';
import {
  ENABLE_NEW_SN_ITSM_CONNECTOR,
  ENABLE_NEW_SN_SIR_CONNECTOR,
  // eslint-disable-next-line @kbn/eslint/no-restricted-paths
} from '../../../actions/server/constants/connectors';

export const getConnectorById = (
  id: string,
  connectors: CaseActionConnector[]
): CaseActionConnector | null => connectors.find((c) => c.id === id) ?? null;

const validators: Record<
  string,
  (connector: CaseActionConnector) => ReturnType<ValidationConfig['validator']>
> = {
  [ConnectorTypes.swimlane]: swimlaneConnectorValidator,
  [ConnectorTypes.serviceNowITSM]: servicenowConnectorValidator,
  [ConnectorTypes.serviceNowSIR]: servicenowConnectorValidator,
};

export const getConnectorsFormValidators = ({
  connectors = [],
  config = {},
}: {
  connectors: CaseActionConnector[];
  config: FieldConfig;
}): FieldConfig => ({
  ...config,
  validations: [
    {
      validator: ({ value: connectorId }) => {
        const connector = getConnectorById(connectorId as string, connectors);
        if (connector != null) {
          return validators[connector.actionTypeId]?.(connector);
        }
      },
    },
  ],
});

export const getConnectorIcon = (
  triggersActionsUi: StartPlugins['triggersActionsUi'],
  type?: string
): IconType => {
  /**
   * triggersActionsUi.actionTypeRegistry.get will throw an error if the type is not registered.
   * This will break Kibana if not handled properly.
   */
  const emptyResponse = '';

  if (type == null) {
    return emptyResponse;
  }

  try {
    if (triggersActionsUi.actionTypeRegistry.has(type)) {
      return triggersActionsUi.actionTypeRegistry.get(type).iconClass;
    }
  } catch {
    return emptyResponse;
  }

  return emptyResponse;
};

// TODO: Remove when the applications are certified
export const isLegacyConnector = (connector?: CaseActionConnector) => {
  if (connector == null) {
    return true;
  }

  if (!ENABLE_NEW_SN_ITSM_CONNECTOR && connector.actionTypeId === '.servicenow') {
    return true;
  }

  if (!ENABLE_NEW_SN_SIR_CONNECTOR && connector.actionTypeId === '.servicenow-sir') {
    return true;
  }

  return connector.config.isLegacy;
};
