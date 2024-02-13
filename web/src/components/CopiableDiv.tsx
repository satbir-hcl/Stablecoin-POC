import {
    HStack,
} from '@chakra-ui/react';

import React from 'react';
import TooltipCopy from "./ToolTipCopy/ToolTipCopy";
import Icon from "./Icon";

interface BaseContainerProps {
    valueToCopy:string;
    valueToDisplay:string;
}

function CopiableDiv({ valueToCopy, valueToDisplay } : BaseContainerProps) {
    return (
        <HStack>
            <div>{valueToDisplay}</div>
            <TooltipCopy valueToCopy={ valueToCopy ?? ''}>
                <Icon name='Copy' />
            </TooltipCopy>
        </HStack>
    );
};

export default CopiableDiv ;
