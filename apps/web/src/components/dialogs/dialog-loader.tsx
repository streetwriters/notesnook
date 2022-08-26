import Dialog from "./dialog";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Flex } from "rebass";

export default function DialogLoader() {
  return (
    <Dialog
      isOpen={true}
      title={<Skeleton height={30} width={150} />}
      description={<Skeleton height={15} width={100} />}
    >
      <Skeleton height={200} />
      <Flex
        sx={{
          mb: 3,
          mt: 1,
          justifyContent: "flex-end",
          alignItems: "flex-end"
        }}
      >
        <Skeleton height={25} width={70} />
      </Flex>
    </Dialog>
  );
}
