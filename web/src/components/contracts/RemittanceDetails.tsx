import { useEffect, useRef } from "react";

import {
  Flex,
  Input,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  useDisclosure,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  FormControl,
  FormLabel,
  ModalFooter,
  Divider,
} from "@chakra-ui/react";
import CopiableDiv from "../CopiableDiv";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  selectFactoryContractAddress,
  selectRemittanceContractAddress,
  setFactoryContractAddress,
  setRemittanceContractAddress,
} from "../../services/globalStateSlice";

import { dottedString } from "../../services/utils";
import { EditIcon } from "@chakra-ui/icons";

function RemittanceDetails() {
  const dispatch = useAppDispatch();
  const remittanceContractAddress = useAppSelector(
    selectRemittanceContractAddress
  );
  const factoryContractAddress = useAppSelector(selectFactoryContractAddress);
  const factoryAddressRef = useRef<any>();
  const remittanceContractAddressRef = useRef<any>();

  const {
    isOpen: isFactoryContractOpen,
    onOpen: onFactoryContractOpen,
    onClose: onFactoryContractClose,
  } = useDisclosure();
  const {
    isOpen: isRemittanceContractOpen,
    onOpen: onRemittanceContractOpen,
    onClose: onRemittanceContractClose,
  } = useDisclosure();

  const updateFactoryContractAddress = async () => {
    console.log("newFactoryContractAddress", factoryAddressRef.current);
    dispatch(setFactoryContractAddress(factoryAddressRef.current?.value));
    onFactoryContractClose();
  };

  const updateRemittanceContractAddress = async () => {
    console.log(
      "newFactoryContractAddress",
      remittanceContractAddressRef.current
    );
    dispatch(
      setRemittanceContractAddress(remittanceContractAddressRef.current?.value)
    );
    onRemittanceContractClose();
  };

  // save remittance address to localstorage
  useEffect(() => {
    if (remittanceContractAddress !== "undefined") {
      localStorage.setItem(
        "remittanceContractAddress",
        remittanceContractAddress
      );
    }
  }, [remittanceContractAddress]);

  return (
    <Flex align={"start"}>
      <Modal
        initialFocusRef={factoryAddressRef}
        isOpen={isFactoryContractOpen}
        onClose={onFactoryContractOpen}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Factory Contract</ModalHeader>
          <ModalBody pb={6}>
            <Stat>
              <StatLabel textStyle={"bold"}>
                <b>Current Factory Contract</b>
                {factoryContractAddress && (
                  <CopiableDiv
                    valueToCopy={factoryContractAddress}
                    valueToDisplay={factoryContractAddress}
                  />
                )}
              </StatLabel>
            </Stat>
            <Divider></Divider>
            <br></br>
            <FormControl>
              <FormLabel>Factory Contract Address</FormLabel>
              <Input
                ref={factoryAddressRef}
                placeholder="Factory Contract Addresss 0x...."
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              onClick={updateFactoryContractAddress}
              mr={3}
            >
              Save
            </Button>
            <Button onClick={onFactoryContractClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        initialFocusRef={remittanceContractAddressRef}
        isOpen={isRemittanceContractOpen}
        onClose={onRemittanceContractClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Remittance Contract</ModalHeader>
          <ModalBody pb={6}>
            <Stat>
              <StatLabel textStyle={"bold"}>
                <b>Current Remittance Contract</b>
                {factoryContractAddress && (
                  <CopiableDiv
                    valueToCopy={remittanceContractAddress}
                    valueToDisplay={remittanceContractAddress}
                  />
                )}
              </StatLabel>
            </Stat>
            <Divider></Divider>
            <br></br>
            <FormControl>
              <FormLabel>Remittance Contract Address</FormLabel>
              <Input
                ref={remittanceContractAddressRef}
                placeholder="Remittance Contract Addresss 0x...."
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              onClick={updateRemittanceContractAddress}
              mr={3}
            >
              Save
            </Button>
            <Button onClick={onRemittanceContractClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Stat>
        <StatLabel width={"200px"}>
          <Link onClick={onFactoryContractOpen}>
            Factory Contract <EditIcon></EditIcon>
          </Link>
        </StatLabel>
        <StatNumber>
          {factoryContractAddress && (
            <CopiableDiv
              valueToCopy={factoryContractAddress}
              valueToDisplay={dottedString(factoryContractAddress)}
            />
          )}
        </StatNumber>
      </Stat>
      <Stat marginLeft={"40px"} width={"300px"}>
        <StatLabel>
          <Link onClick={onRemittanceContractOpen}>
            Remittance Contract <EditIcon></EditIcon>
          </Link>
        </StatLabel>
        <StatNumber>
          {remittanceContractAddress && (
            <CopiableDiv
              valueToCopy={remittanceContractAddress}
              valueToDisplay={dottedString(remittanceContractAddress)}
            />
          )}
        </StatNumber>
      </Stat>
    </Flex>
  );
}

export default RemittanceDetails;
