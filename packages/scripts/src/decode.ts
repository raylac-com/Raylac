import { decodeERC5564MetadataAsViewTag } from '@raylac/shared';

const decode = () => {
  const metadata = '0x5500007a6900000000';

  const decoded = decodeERC5564MetadataAsViewTag(metadata);

  console.log(decoded);
};

decode();
