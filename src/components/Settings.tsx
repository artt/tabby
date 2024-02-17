import React from "react"
import { Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, FormLabel, HStack, IconButton, Input, InputGroup, InputRightElement } from "@chakra-ui/react"
import { TbEye, TbEyeClosed } from "react-icons/tb"
import { useForm } from "react-hook-form";
import { FaCheck } from "react-icons/fa";

type SettingsProps = {
  isSettingsOpen: boolean,
  onSettingsClose: () => void,
  // settings: {[k: string]: unknown},
  // setSettings: (settings: {[k: string]: unknown}) => void
  apiKey: string,
  setApiKey: (apiKey: string) => void
}



export default function Settings({isSettingsOpen, onSettingsClose, apiKey, setApiKey}: SettingsProps) {

  const [showKey, setShowKey] = React.useState(false)

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm({ defaultValues: { apiKey } });
  function onSubmit(data: {[k: string]: unknown}) {
    setApiKey(data.apiKey as string)
    reset({ apiKey: data.apiKey as string })
  }

  function handleClose() {
    // check if form is dirty
    reset({ apiKey })
    onSettingsClose()
  }

  return (

    <Drawer
      isOpen={isSettingsOpen}
      placement="bottom"
      onClose={handleClose}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Settings</DrawerHeader>
        <DrawerBody>
          <FormLabel>OpenAI API Key</FormLabel>
          <form onSubmit={handleSubmit(onSubmit)}>
            <HStack>
              <InputGroup>
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder='OpenAI API Keyxxxx'
                  defaultValue={apiKey}
                  {...register("apiKey")}
                />
                <InputRightElement>
                  <IconButton
                    aria-label='Show API Key'
                    icon={showKey ? <TbEye /> : <TbEyeClosed />}
                    variant='ghost'
                    onClick={() => setShowKey(!showKey)}
                  />
                </InputRightElement>
              </InputGroup>
              <IconButton
                aria-label='Save API Key'
                type='submit'
                isDisabled={!isDirty}
                icon={<FaCheck />}
                colorScheme="green"
                onClick={() => {
                  console.log('save')
                  // setApiKey(apiKey)
                }}
              />
            </HStack>
          </form>
        </DrawerBody>

        <DrawerFooter>
        </DrawerFooter>

      </DrawerContent>
    </Drawer>
  )

}