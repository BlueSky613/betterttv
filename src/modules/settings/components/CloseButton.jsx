import * as faTimes from '@fortawesome/free-solid-svg-icons/faTimes';
import {Icon} from '@rsuite/icons';
import React from 'react';
import IconButton from 'rsuite/IconButton';
import FontAwesomeSvgIcon from '../../../common/components/FontAwesomeSvgIcon.jsx';

export default function CloseButton(props) {
  const {onClose, ...restProps} = props;

  return (
    <div {...restProps}>
      <IconButton
        icon={<Icon as={FontAwesomeSvgIcon} fontAwesomeIcon={faTimes} />}
        onClick={onClose}
        appearance="subtle"
      />
    </div>
  );
}
