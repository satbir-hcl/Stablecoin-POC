import { Box, Tooltip, useClipboard } from '@chakra-ui/react';
import type { TooltipProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface TooltipCopyProps extends TooltipProps {
    children: ReactNode;
    valueToCopy?: string;
}

const TooltipCopy = ({ children, valueToCopy = '', ...props }: TooltipCopyProps) => {

    const { setValue, hasCopied, onCopy } = useClipboard(valueToCopy);
    useEffect(() => {
        setValue(valueToCopy);
    }, [valueToCopy]);

    return (
        <Tooltip
            label={hasCopied ? 'copied' : 'copy'}
            closeOnClick={false}
            hasArrow
            bgColor='black'
            borderRadius='5px'
            {...props}
        >
            <Box _hover={{ cursor: 'pointer' }} onClick={onCopy}>
                {children}
            </Box>
        </Tooltip>
    );
};

export default TooltipCopy;
