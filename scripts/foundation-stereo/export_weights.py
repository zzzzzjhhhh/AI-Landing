"""Losslessly extract inference tensors from a hash-verified training checkpoint."""
import argparse
import collections
import codecs
import hashlib
import json
from pathlib import Path
import typing
import numpy as np
import torch
import omegaconf
from omegaconf.base import ContainerMetadata, Metadata
from omegaconf.nodes import AnyNode
from safetensors.torch import save_file, load_file


def sha(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f,'sha256').hexdigest()


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--input',type=Path,required=True)
    p.add_argument('--sha256',required=True)
    p.add_argument('--output',type=Path,required=True)
    a=p.parse_args()
    assert sha(a.input)==a.sha256, 'Source checkpoint hash mismatch'
    torch.serialization.add_safe_globals([omegaconf.DictConfig,omegaconf.ListConfig,
        ContainerMetadata,Metadata,AnyNode,typing.Any,dict,list,int,collections.defaultdict,
        np.core.multiarray.scalar,np.dtype,type(np.dtype('float64')),codecs.encode])
    checkpoint=torch.load(a.input,map_location='cpu',weights_only=True)
    state={k:v.contiguous().clone() for k,v in checkpoint['model'].items()}
    assert all(torch.is_tensor(v) for v in state.values())
    save_file(state,str(a.output),metadata={'source_sha256':a.sha256,'conversion':'No dtype or value changes; optimizer removed.'})
    restored=load_file(str(a.output))
    assert restored.keys()==state.keys()
    assert all(restored[k].dtype==v.dtype and torch.equal(restored[k],v) for k,v in state.items())
    result={'source_sha256':a.sha256,'output_sha256':sha(a.output),'tensor_count':len(state),
        'elements':sum(v.numel() for v in state.values()),'bytes':a.output.stat().st_size,'bit_exact':True}
    a.output.with_suffix('.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
