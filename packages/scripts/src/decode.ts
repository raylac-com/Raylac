import { decodeERC5564MetadataAsViewTag } from '@raylac/shared';

const decode = () => {
  const metadata = '0x9700002105015521750000a4b110558381';

  const decoded = decodeERC5564MetadataAsViewTag(metadata);

  console.log(decoded);
};

decode();
